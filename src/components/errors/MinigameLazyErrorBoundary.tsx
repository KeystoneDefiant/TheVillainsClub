import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Stack, Text, Title } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";

type Props = {
  children: ReactNode;
  /** Called when the player leaves after an error (e.g. navigate to `/bar`). */
  onLeave?: () => void;
};

type State = { hasError: boolean; error: Error | null };

/**
 * Catches render errors and failed lazy boundaries for minigame routes.
 * Chunk load failures often surface here after deploy.
 */
export class MinigameLazyErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[MinigameLazyErrorBoundary]", error, info);
    }
  }

  private handleRetry = (): void => {
    window.location.reload();
  };

  private handleLeave = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onLeave?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          p="xl"
          style={{
            minHeight: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: clubTokens.surface.deepWalnut,
          }}
        >
          <Stack gap="md" maw={420} align="stretch">
            <Title order={3} c={clubTokens.text.primary}>
              This table failed to load
            </Title>
            <Text size="sm" c={clubTokens.text.muted}>
              A minigame script or asset could not load. After a game update, try a full refresh. If you were in a
              session, your club balance is unchanged until you settle at the table.
            </Text>
            {import.meta.env.DEV && this.state.error ? (
              <Text size="xs" ff="monospace" c={clubTokens.text.dimGreen} style={{ wordBreak: "break-word" }}>
                {this.state.error.message}
              </Text>
            ) : null}
            <Button onClick={this.handleRetry} color="yellow" variant="filled">
              Reload
            </Button>
            <Button onClick={this.handleLeave} variant="light" color="gray">
              Return to club
            </Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}
