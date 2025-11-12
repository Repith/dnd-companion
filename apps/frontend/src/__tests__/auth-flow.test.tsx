import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AuthProvider } from "../contexts/AuthContext";
import SignInPage from "../app/signin/page";
import { authApi } from "../lib/api/auth";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
  }),
}));

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the api instance with interceptors
const mockApi = {
  ...mockedAxios,
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

// Mock the auth module
jest.mock("../lib/api/auth", () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    logout: jest.fn(),
  },
}));

describe("Authentication Flow Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("successful login flow", async () => {
    const user = userEvent.setup();

    // Mock successful login response
    (authApi.login as jest.Mock).mockResolvedValue({
      access_token: "fake-token",
      user: {
        id: "1",
        username: "testuser",
        email: "test@example.com",
        roles: ["user"],
        subscriptionTier: "free",
        profile: {},
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    // Mock successful profile fetch
    (authApi.getProfile as jest.Mock).mockResolvedValue({
      id: "1",
      username: "testuser",
      email: "test@example.com",
      roles: ["user"],
      subscriptionTier: "free",
      profile: {},
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <AuthProvider>
        <SignInPage />
      </AuthProvider>,
    );

    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Check that API was called with correct data
    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    // Check that user is redirected to dashboard
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("login failure shows error message", async () => {
    const user = userEvent.setup();

    // Mock failed login response
    (authApi.login as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    });

    render(
      <AuthProvider>
        <SignInPage />
      </AuthProvider>,
    );

    // Fill in the form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "wrong@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    // Check that user is not redirected
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("form validation prevents submission with invalid data", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignInPage />
      </AuthProvider>,
    );

    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Try to submit empty form
    await user.click(submitButton);

    // Check that validation errors are shown
    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });

    // Check that API was not called
    expect(authApi.login).not.toHaveBeenCalled();
  });
});
