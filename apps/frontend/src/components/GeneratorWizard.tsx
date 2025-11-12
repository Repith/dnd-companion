"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateGeneratorRequestFormData,
  createGeneratorRequestSchema,
} from "@/lib/validations/generator";
import { generatorApi } from "@/lib/api/generator";
import {
  GeneratorType,
  GeneratorRequest,
  GeneratedEntity,
} from "@/types/generator";
import GeneratorConfigStep from "./generator/GeneratorConfigStep";
import GeneratorResultStep from "./generator/GeneratorResultStep";

const STEPS = [
  {
    id: 1,
    title: "Configure Generation",
    description: "Choose type and provide details",
  },
  { id: 2, title: "Review & Approve", description: "Review generated content" },
];

interface GeneratorWizardProps {
  onComplete?: (entity: GeneratedEntity) => void;
}

export default function GeneratorWizard({ onComplete }: GeneratorWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, setRequest] = useState<GeneratorRequest | null>(null);
  const [result, setResult] = useState<GeneratedEntity | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const form = useForm<CreateGeneratorRequestFormData>({
    resolver: zodResolver(createGeneratorRequestSchema),
    defaultValues: {
      type: GeneratorType.NPC,
      tags: [],
      prompt: "",
    },
  });

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startPolling = (requestId: string) => {
    const interval = setInterval(async () => {
      try {
        const updatedRequest = await generatorApi.getRequestById(requestId);
        setRequest(updatedRequest);

        if (updatedRequest.status === "COMPLETED" && updatedRequest.resultId) {
          const entity = await generatorApi.getGeneratedEntityById(
            updatedRequest.resultId,
          );
          setResult(entity);
          nextStep();
          if (pollingInterval) clearInterval(pollingInterval);
          setPollingInterval(null);
        } else if (updatedRequest.status === "FAILED") {
          // Handle failure
          if (pollingInterval) clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } catch (error) {
        console.error("Error polling request:", error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  const onSubmit = async (data: CreateGeneratorRequestFormData) => {
    try {
      setIsSubmitting(true);
      const newRequest = await generatorApi.createRequest(data);
      setRequest(newRequest);
      startPolling(newRequest.id);
    } catch (error) {
      console.error("Failed to create generation request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => {
    if (result && onComplete) {
      onComplete(result);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <GeneratorConfigStep form={form} />;
      case 2:
        return (
          <GeneratorResultStep
            request={request}
            result={result}
            onApprove={handleApprove}
            onEdit={() => {}} // TODO: Implement edit functionality
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Content Generator
        </h1>
        <p className="text-gray-600">
          Generate NPCs, locations, and quests for your D&D campaign
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id < currentStep
                  ? "text-green-600"
                  : step.id === currentStep
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id < currentStep
                    ? "bg-green-600 text-white"
                    : step.id === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step.id < currentStep ? "✓" : step.id}
              </div>
              <div className="hidden ml-3 sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="h-2 mt-4 bg-gray-200 rounded-full">
          <div
            className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 ? (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 mb-6 bg-white border rounded-lg shadow-sm">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Generating..." : "Generate Content"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 mb-6 bg-white border rounded-lg shadow-sm">
          {renderStep()}
        </div>
      )}
    </div>
  );
}
