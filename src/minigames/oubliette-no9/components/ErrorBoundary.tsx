import { Component, ReactNode, ErrorInfo } from "react";
import { Box, Button, Center, Code, Paper, Stack, Text, Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** When provided, shows "Return to Menu" button to reset app state */
  onReturnToMenu?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors
 * Prevents entire app from crashing when an error occurs in a child component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Center
          style={{
            minHeight: "100vh",
            padding: "var(--mantine-spacing-md)",
            background: `linear-gradient(180deg, ${clubTokens.surface.deepWalnut}, ${clubTokens.surface.walnut})`,
          }}
        >
          <Paper
            p="xl"
            maw={480}
            w="100%"
            radius="md"
            style={{
              border: `1px solid ${clubTokens.surface.brassStroke}`,
              backgroundColor: clubTokens.surface.panel,
            }}
          >
            <Stack gap="md">
              <Title order={3} c={clubTokens.text.brass}>
                Something went wrong
              </Title>
              <Text size="sm" c={clubTokens.text.secondary}>
                An unexpected error occurred. You can try again, return to the menu, or reload the page.
              </Text>
              {import.meta.env.DEV && this.state.error && (
                <Box
                  p="sm"
                  style={{
                    borderRadius: "var(--mantine-radius-sm)",
                    border: `1px solid ${clubTokens.surface.brassStroke}`,
                    backgroundColor: "rgba(0,0,0,0.35)",
                  }}
                >
                  <Code block style={{ color: clubTokens.text.muted, background: "transparent", fontSize: "0.75rem" }}>
                    {this.state.error.toString()}
                  </Code>
                </Box>
              )}
              <Stack gap="xs">
                <Button variant="filled" color="yellow" onClick={this.handleReset} fullWidth>
                  Try again
                </Button>
                {this.props.onReturnToMenu && (
                  <Button variant="light" color="gray" onClick={() => this.props.onReturnToMenu?.()} fullWidth>
                    Return to menu
                  </Button>
                )}
                <Button variant="default" onClick={() => window.location.reload()} fullWidth>
                  Reload page
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Center>
      );
    }

    return this.props.children;
  }
}
