import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Group, Stack, Text } from "@mantine/core";
import { motion } from "framer-motion";
import { MenuHazeBackground } from "@/components/layout/MenuHazeBackground";
import { ClubTableGamesSection } from "@/components/club/ClubTableGamesSection";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubHeading } from "@/components/ui/ClubHeading";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { isBarRouteState, tableReturnTagline } from "@/game/barRouteState";
import { useMotionPresetStore } from "@/motion/motionPresetStore";
import { shellMenuContainerVariants, shellMenuItemVariants } from "@/motion/shellMotion";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import { clubTokens } from "@/theme/clubTokens";

export function BarStubPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const preset = useMotionPresetStore((s) => s.preset);
  const reduceMotion = usePrefersReducedMotion();
  const [settlementFlash] = useState(() => (isBarRouteState(location.state) ? location.state : null));

  useEffect(() => {
    document.title = "The bar — The Villains Club";
  }, []);

  useLayoutEffect(() => {
    if (isBarRouteState(location.state)) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const container = useMemo(
    () => shellMenuContainerVariants(preset, reduceMotion),
    [preset, reduceMotion],
  );
  const item = useMemo(() => shellMenuItemVariants(preset, reduceMotion), [preset, reduceMotion]);

  return (
    <Box
      style={{
        position: "relative",
        minHeight: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <MenuHazeBackground />
      <Group
        justify="space-between"
        align="flex-start"
        wrap="nowrap"
        p={{ base: "md", sm: "xl" }}
        style={{ position: "relative", zIndex: 1, height: "100%" }}
      >
        <Stack gap="xs" maw={420} visibleFrom="sm">
          <Text size="sm" tt="uppercase" c={clubTokens.text.muted} fw={600}>
            Inside
          </Text>
          <ClubHeading order={2} size="h2" c={clubTokens.text.primary}>
            The bar
          </ClubHeading>
          <Text c={clubTokens.text.secondary}>
            The bartender polishes a glass that was never dirty. Ice sings in the bin. Out here we only care about two
            numbers: what you walked in with, and what you dare put on the felt.
          </Text>
          <Text size="sm" c={clubTokens.text.muted} fs="italic">
            Tables pull a clean buy-in from your club tab—everything past that is session stakes until you settle.
          </Text>
        </Stack>

        <ClubPanel maw={440} w="100%" mx={{ base: "auto", sm: 0 }}>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ width: "100%", backfaceVisibility: "hidden" }}
          >
            <Stack gap="lg">
              <motion.div variants={item} style={{ backfaceVisibility: "hidden" }}>
                <ClubHeading order={3} size="h3" c={clubTokens.text.brass} hiddenFrom="sm">
                  The bar
                </ClubHeading>
              </motion.div>

              {settlementFlash?.lastTable ? (
                <motion.div variants={item} style={{ backfaceVisibility: "hidden" }}>
                  <Alert color="teal" variant="light" title="Table settled">
                    <Text size="sm">{tableReturnTagline(settlementFlash.lastTable)}</Text>
                    <Text size="sm" mt={6} c="dimmed">
                      Returned {settlementFlash.lastTable.totalReturn.toLocaleString()} credits to the club (buy-in{" "}
                      {settlementFlash.lastTable.buyIn.toLocaleString()}).
                    </Text>
                  </Alert>
                </motion.div>
              ) : null}

              <motion.div variants={item} style={{ backfaceVisibility: "hidden" }}>
                <ClubTableGamesSection />
              </motion.div>
              <motion.div variants={item} style={{ backfaceVisibility: "hidden" }}>
                <ClubButton component={Link} to="/menu" variant="light" fullWidth>
                  Back to main menu
                </ClubButton>
                <Text size="xs" c={clubTokens.text.muted} ta="center" mt="xs" fs="italic">
                  The velvet closes behind you—carry the smoke in your coat, not the grudge.
                </Text>
              </motion.div>
            </Stack>
          </motion.div>
        </ClubPanel>
      </Group>
    </Box>
  );
}
