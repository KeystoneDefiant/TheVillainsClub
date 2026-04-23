import { Link } from "react-router-dom";
import { Box, Stack, Text } from "@mantine/core";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { clubTokens } from "@/theme/clubTokens";

export function BarStubPage() {
  return (
    <Box style={{ position: "relative", height: "100%" }}>
      <MenuHazeBackground />
      <Stack
        align="center"
        justify="center"
        gap="md"
        p="xl"
        style={{ position: "relative", zIndex: 1, height: "100%" }}
      >
        <ClubHeading order={2} ta="center" c={clubTokens.text.primary}>
          The bar
        </ClubHeading>
        <Text c={clubTokens.text.secondary} ta="center" maw={520}>
          Drink service and table buy-ins will land here next. For now, this route proves navigation out of the
          main menu shell.
        </Text>
        <ClubButton component={Link} to="/menu" variant="light">
          Back to menu
        </ClubButton>
      </Stack>
    </Box>
  );
}
