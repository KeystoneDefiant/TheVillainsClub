import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Group, Stack, TextInput, Title, Text } from "@mantine/core";
import { ClubButton } from "@/components/ui/ClubButton";
import { ClubPanel } from "@/components/ui/ClubPanel";
import { useClubWallet } from "@/game/clubWalletStore";
import { clubTokens } from "@/theme/clubTokens";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/motion/usePrefersReducedMotion";
import "./OnboardingPage.css";

interface OnboardingSlide {
  type: "staff" | "lore" | "rules";
  category?: string;
  role?: string;
  title?: string;
  description?: string | string[];
  details?: string[];
  dialogue?: string;
  image?: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    type: "lore",
    title: "The Villains Club",
    details: [
      "Hidden in a small basement, under the city streets, behind a mahogany door, lies the ultimate refuge for the world's most elite scoundrels.",
      "Here, sworn enemies toast with their drinks of choice, and the only battles fought are settled with wagers.",
      "Plans are made in whispers. Deals are sealed with a handshake. Reputations are made and broken over a single roll of the dice.",
      "Discretion is absolute. What happens within the wood-paneled walls of the Club never leaves them."
    ],
    image: "images/onboarding/ClubOutside.png",
  },
  {
    type: "rules",
    title: "The House Rules",
    details: [
      "Rule I: No weapons, no violence, no exceptions.",
      "Rule II: All wagers are placed using verified Club Credits.",
      "Rule III: Debt is a serious matter.",
      "Rule IV: Your attire should speak for you.",
      "Rule V: This place does not exist.",
      "Rule VI: Do not unsettle the spirits."
    ],
    image: "images/onboarding/InsideBar.png",
  },
  {
    type: "rules",
    category: "House Rules",
    role: "Bankruptcy Protection",
    title: "Intervention",
    details: [
      "A villain without credits is a tragedy. If your wallet falls below 2,000 credits, the Club is happy to float you a loan.",
      "However, this charity strips you of all reputation, limiting your social standing at the Club.",
      "To restore your name, you must pay back the loan once you have amassed 30,000+ in your club account."
    ],
    dialogue: "A clean slate comes at a cost, friend. I can lend you a hand, but the smell of defeat takes a while to wash off.",
    image: "images/onboarding/intervention.png",
  },
  {
    type: "staff",
    category: "Staff Dossier",
    role: "Sommelier",
    title: "Pazillus A. Rabellum",
    description: "Immaculate host with dry wit, expert in fine wines, fine dining, and etiquette. \n\nYour guide when it comes to drinks and our games. \n\nPersonable and as elegant with a corkscrew as he is a switchblade.",
    dialogue: "Welcome, new patron. I shall ensure your glass is never empty, and your wagers... well, let us hope they are just as bountiful.",
    image: "images/onboarding/Paz.png",
  },
  {
    type: "staff",
    category: "Staff Dossier",
    role: "Pit Boss",
    title: "Claudius L'Ausula",
    description: "Imposing but fair pit boss. Stern, unreadable face with a rare, devastating sense of humor at the most inappropriate times. He's the law of the club, but will also make sure your time spent here is entertaining. \n\nIf you require some help with a game, he's more than happy to lend you a few choice tips to keep you enough in the green so both you and he are happy.",
    dialogue: "The house is always watching... but I'm the one who decides when to smile.",
    image: "images/onboarding/Claudius.png",
  },
  {
    type: "staff",
    category: "Staff Dossier",
    role: "Bouncer",
    title: "Octavia Beatrice Stare",
    description: "Polite and approachable bouncer who maintains order with a kind smile. Deadlifts cars for fun and profit, should you make that wager against her. \n\nOctavia has numbers scribbled on a paper behind her at the bouncer's post - the all time leaderboard for distance when throwing troublemakers out, but it's also said these can be used as lucky numbers in a pinch. \n\nKnown to act as a vocalist when a band needs a fill in.",
    dialogue: "I do love a friendly face. Shame if it happens to be a smear on the sidewalk at the end of the night.",
    image: "images/onboarding/Octavia.png",
  },
  {
    type: "staff",
    category: "Staff Dossier",
    role: "Bartender",
    title: "Francis Uriah Ndere",
    description: "Wise and charismatic bartender with an impossibly accurate memory for wagers and drinks. Terrifyingly perceptive and possessing a smile that can disarm armies. Pours are accurate, proportions are precise, and will make sure you're sober by the end of the night without you even noticing.\n\nMajored in psychology, with a minor in math. If you tell him about your bad beat, he'll be the first to listen to your troubles, and then tell you the exact odds that you had in your situation.",
    dialogue: "The usual, my friend? Or perhaps you'd care to try something a little more... ambitious?",
    image: "images/onboarding/Francis.png",
  },
  {
    type: "lore",
    title: "The Villains Club",
    details: [
      "You are now a member here at The Villains Club, with all the rights and privileges afforded to a new villain in our ranks.",
      "Paz will walk you through each game as you decide to imbibe in them. Failure to listen well to his advice will leave you in debt rather quickly.",
      "Claudius is usually near the card table, minding the house, but he's always happy to lend you a few tips.",
      "Octavia can be found near the door, ensuring that no one leaves without paying their dues. May you never meet her professionally.",
      "Francis is usually near the bar, mixing up drinks and listening to your troubles. Should you find yourself in need of a loan, he's your man.",
      "Welcome to The Villains Club."
    ],
    image: "images/logos/VC Logotype - Color.svg",
  },
];

const textVariants = {
  initial: (custom: { direction: "next" | "back"; reduceMotion: boolean }) => ({
    opacity: 0,
    x: custom.reduceMotion ? 0 : (custom.direction === "next" ? 80 : -80),
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (custom: { direction: "next" | "back"; reduceMotion: boolean }) => ({
    opacity: 0,
    x: custom.reduceMotion ? 0 : (custom.direction === "next" ? -80 : 80),
  }),
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setPlayerName = useClubWallet((s) => s.setPlayerName);

  const shouldSkipName = location.state?.skipName || new URLSearchParams(location.search).get("skipName") === "true";

  const [phase, setPhase] = useState<"name" | "staff" | "zoom">(shouldSkipName ? "staff" : "name");
  const [name, setName] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [isZooming, setIsZooming] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setPlayerName(name.trim());
    setPhase("staff");
  };

  const handleBack = () => {
    setDirection("back");
    if (slideIndex === 0) {
      if (shouldSkipName) {
        navigate(-1);
      } else {
        setPhase("name");
      }
    } else {
      setSlideIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    setDirection("next");
    if (slideIndex < ONBOARDING_SLIDES.length - 1) {
      setSlideIndex((i) => i + 1);
    } else {
      setPhase("zoom");
    }
  };

  useEffect(() => {
    if (phase === "zoom") {
      setIsZooming(true);
      const timer = setTimeout(() => {
        navigate("/bar", { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, navigate]);

  const slide = ONBOARDING_SLIDES[slideIndex];
  const isLast = slideIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <Box
      className={phase !== "name" ? "onboarding-staff-bg" : ""}
      style={{
        minHeight: "100dvh",
        background: phase === "name" ? "linear-gradient(to bottom, #2b0b10 0%, #0a0a0a 100%)" : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <AnimatePresence mode="wait">
        {phase === "name" && (
          <motion.div
            key="name-screen"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{ width: "100%", maxWidth: "440px", padding: "1.5rem", boxSizing: "border-box" }}
          >
            <form onSubmit={handleNameSubmit}>
              <Stack align="center" gap="xl">
                <Stack gap="xs" align="center">
                  <Title
                    order={1}
                    c={clubTokens.text.accent}
                    style={{
                      fontFamily: "Georgia, serif",
                      fontWeight: 400,
                      fontSize: "2.5rem",
                      letterSpacing: "0.05em",
                      textAlign: "center",
                    }}
                  >
                    Welcome to The Villains Club
                  </Title>
                  <Text
                    c={clubTokens.text.muted}
                    size="lg"
                    style={{
                      fontFamily: "Georgia, serif",
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    By what name shall we call you?
                  </Text>
                </Stack>

                <TextInput
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Your name..."
                  size="lg"
                  w="100%"
                  autoFocus
                  styles={{
                    input: {
                      background: "rgba(0, 0, 0, 0.4)",
                      border: `1px solid ${clubTokens.surface.brassStroke}`,
                      color: clubTokens.text.primary,
                      fontFamily: "Georgia, serif",
                      textAlign: "center",
                      fontSize: "1.25rem",
                    },
                  }}
                />

                <ClubButton
                  type="submit"
                  size="lg"
                  variant="filled"
                  disabled={!name.trim()}
                  style={{
                    minWidth: 200,
                  }}
                >
                  Enter the Club
                </ClubButton>
              </Stack>
            </form>
          </motion.div>
        )}

        {phase === "staff" && (
          <motion.div
            key="staff-screen"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="onboarding-split-container"
            layout={!reduceMotion}
          >
            <motion.div
              layout={!reduceMotion}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="onboarding-staff-card-wrap"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <ClubPanel
                p="xl"
                style={{
                  border: `2px solid ${clubTokens.surface.brassStroke}`,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack gap="md" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                  <AnimatePresence mode="popLayout" custom={{ direction, reduceMotion }}>
                    <motion.div
                      key={slideIndex}
                      custom={{ direction, reduceMotion }}
                      variants={textVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout={!reduceMotion}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}
                    >
                      <Stack gap={2}>
                        {(slide.category || slide.role) && (
                          <Text size="xs" tt="uppercase" fw={800} c={clubTokens.text.muted} style={{ letterSpacing: "0.08em" }}>
                            {slide.category}
                            {slide.category && slide.role && " • "}
                            {slide.role}
                          </Text>
                        )}
                        {slide.title && (
                          <Title order={2} c={clubTokens.text.brass} style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem" }}>
                            {slide.title}
                          </Title>
                        )}
                      </Stack>

                      <Stack gap="xs">
                        {slide.type === "staff" ? (
                          <>
                            {slide.description && (
                              Array.isArray(slide.description) ? (
                                <Stack gap="xs">
                                  {slide.description.map((paragraph, idx) => (
                                    <Text key={idx} size="xs" c={clubTokens.text.secondary} lh={1.5}>
                                      {paragraph}
                                    </Text>
                                  ))}
                                </Stack>
                              ) : (
                                <Stack gap="xs">
                                  {slide.description.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((paragraph, idx) => (
                                    <Text key={idx} size="xs" c={clubTokens.text.secondary} lh={1.5}>
                                      {paragraph}
                                    </Text>
                                  ))}
                                </Stack>
                              )
                            )}
                          </>
                        ) : (
                          <Stack gap="xs">
                            {slide.details?.map((detail, idx) => (
                              <Text key={idx} size="xs" c={clubTokens.text.secondary} lh={1.4}>
                                {detail}
                              </Text>
                            ))}
                          </Stack>
                        )}
                      </Stack>

                      {slide.dialogue && (
                        <div className="staff-quote-block">
                          <Text size="sm" fs="italic" c={clubTokens.text.primary} className="staff-quote-glow">
                            “{slide.dialogue}”
                          </Text>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <Group justify="space-between" align="center" mt="sm">
                    <Text size="xs" c={clubTokens.text.muted} fw={600}>
                      {slideIndex + 1} of {ONBOARDING_SLIDES.length}
                    </Text>
                    <Group gap="md" style={{ marginRight: "12px" }}>
                      <ClubButton
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={handleBack}
                      >
                        Back
                      </ClubButton>
                      <ClubButton
                        type="button"
                        variant="filled"
                        size="xs"
                        onClick={handleNext}
                      >
                        {isLast ? "Enter Club" : "Next"}
                      </ClubButton>
                    </Group>
                  </Group>
                </Stack>
              </ClubPanel>
            </motion.div>

            <motion.div
              layout={!reduceMotion}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="onboarding-image-column"
            >
              <Box className="onboarding-image-frame" data-testid="onboarding-image-graphic">
                <AnimatePresence mode="wait">
                  {slide.image ? (
                    <motion.img
                      key={slide.image}
                      src={slide.image}
                      alt={slide.title}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="onboarding-slide-image"
                    />
                  ) : (
                    <motion.div
                      key="fallback"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="onboarding-image-fallback"
                    />
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Frame Zoom Overlay */}
      <AnimatePresence>
        {isZooming && (
          <motion.div
            key="zoom-overlay"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            className="onboarding-blackout"
          >
            <motion.div
              initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.6, x: "25vw", opacity: 0 }}
              animate={{
                scale: 14,
                x: "0vw",
                opacity: 1,
              }}
              transition={{
                duration: 1.4,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: "calc(50% - 190px)",
                left: "calc(50% - 100px)",
                transformOrigin: "center center",
              }}
            >
              <Box className="onboarding-image-frame" style={{ boxShadow: "none", background: "#000000" }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
