"use client";

import { useRouter } from "next/navigation";
import CharacterBuilder from "@/components/CharacterBuilder";

export default function CreateCharacterPage() {
  const router = useRouter();

  const handleCharacterCreated = () => {
    router.push("/characters");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl px-4 py-6 mx-auto sm:px-6 lg:px-8">
        <CharacterBuilder onComplete={handleCharacterCreated} />
      </div>
    </div>
  );
}
