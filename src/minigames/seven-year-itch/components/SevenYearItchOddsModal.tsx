import { Modal, Table, Stack, Tabs, Text, Divider, Alert } from "@mantine/core";
import { clubTokens } from "@/theme/clubTokens";
import { ClubButton } from "@/components/ui/ClubButton";

interface SevenYearItchOddsModalProps {
  opened: boolean;
  onClose: () => void;
  placePayoutScale: number;
}

export function SevenYearItchOddsModal({ opened, onClose, placePayoutScale }: SevenYearItchOddsModalProps) {
  const tableStyles = {
    thead: { background: clubTokens.surface.walnutHi },
    th: { color: clubTokens.text.brass, fontWeight: 700, borderBottom: `1px solid ${clubTokens.surface.brassStroke}` },
    td: { color: clubTokens.text.primary, borderBottom: `1px solid rgba(200, 208, 218, 0.08)` },
  };

  const isSkimmed = placePayoutScale < 1;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Table Payouts & Odds"
      centered
      size="lg"
      overlayProps={{ backgroundOpacity: 0.55 }}
      styles={{
        title: { color: clubTokens.text.brass, fontWeight: 700, fontFamily: "Georgia, serif" },
        content: {
          backgroundColor: clubTokens.surface.panel,
          border: `1px solid ${clubTokens.surface.brassStroke}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        },
      }}
    >
      <Stack gap="md">
        {isSkimmed && (
          <Alert color="red" variant="light" title="Post-Divest Skim Active">
            Winning place payouts are skimmed at {Math.round(placePayoutScale * 100)}% on profit. Back-line bets and free odds are unaffected.
          </Alert>
        )}

        <Tabs defaultValue="place" color="yellow" variant="outline">
          <Tabs.List style={{ borderBottom: `1px solid ${clubTokens.surface.brassStroke}` }}>
            <Tabs.Tab value="place" style={{ color: clubTokens.text.primary }}>Place / Line</Tabs.Tab>
            <Tabs.Tab value="free" style={{ color: clubTokens.text.primary }}>Free Odds</Tabs.Tab>
            <Tabs.Tab value="prop" style={{ color: clubTokens.text.primary }}>Props & Hardways</Tabs.Tab>
          </Tabs.List>

          {/* Place & Pass Line Tab */}
          <Tabs.Panel value="place" pt="xs">
            <Text size="xs" c="dimmed" mb="sm">
              Place bets stay on the table and win whenever that point is rolled. Seven out loses all bets.
            </Text>
            <Table style={{ width: "100%" }}>
              <Table.Thead style={tableStyles.thead}>
                <Table.Tr>
                  <Table.Th style={tableStyles.th}>Bet Spot</Table.Th>
                  <Table.Th style={tableStyles.th}>True Payout</Table.Th>
                  <Table.Th style={tableStyles.th}>Current Payout (Scale: {placePayoutScale}x)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Pass Line</Table.Td>
                  <Table.Td style={tableStyles.td}>1 : 1 (Even Money)</Table.Td>
                  <Table.Td style={tableStyles.td}>1 : 1</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Place 2 & 12</Table.Td>
                  <Table.Td style={tableStyles.td}>5 : 1 (25 to 5)</Table.Td>
                  <Table.Td style={tableStyles.td}>
                    {isSkimmed ? "3 : 1 (15 to 5)" : "5 : 1 (25 to 5)"}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Place 3 & 11</Table.Td>
                  <Table.Td style={tableStyles.td}>2.6 : 1 (13 to 5)</Table.Td>
                  <Table.Td style={tableStyles.td}>
                    {isSkimmed ? "1.8 : 1 (9 to 5)" : "2.6 : 1 (13 to 5)"}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Place 4 & 10</Table.Td>
                  <Table.Td style={tableStyles.td}>1.8 : 1 (9 to 5)</Table.Td>
                  <Table.Td style={tableStyles.td}>
                    {isSkimmed ? "1.4 : 1 (7 to 5)" : "1.8 : 1 (9 to 5)"}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Place 5 & 9</Table.Td>
                  <Table.Td style={tableStyles.td}>1.4 : 1 (7 to 5)</Table.Td>
                  <Table.Td style={tableStyles.td}>
                    {isSkimmed ? "1.2 : 1 (6 to 5)" : "1.4 : 1 (7 to 5)"}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Place 6 & 8</Table.Td>
                  <Table.Td style={tableStyles.td}>1.16 : 1 (7 to 6)</Table.Td>
                  <Table.Td style={tableStyles.td}>
                    {isSkimmed ? "1.08 : 1 (13 to 12)" : "1.16 : 1 (7 to 6)"}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          {/* Free Odds Tab */}
          <Tabs.Panel value="free" pt="xs">
            <Text size="xs" c="dimmed" mb="sm">
              Free Odds are bet behind established Pass Line stakes. They carry 0% house edge.
            </Text>
            <Table style={{ width: "100%" }}>
              <Table.Thead style={tableStyles.thead}>
                <Table.Tr>
                  <Table.Th style={tableStyles.th}>Point</Table.Th>
                  <Table.Th style={tableStyles.th}>Payout Odds</Table.Th>
                  <Table.Th style={tableStyles.th}>NV Crapless Multiplier Cap</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>2 & 12</Table.Td>
                  <Table.Td style={tableStyles.td}>6 : 1</Table.Td>
                  <Table.Td style={tableStyles.td}>2x Pass Bet</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>3 & 11</Table.Td>
                  <Table.Td style={tableStyles.td}>3 : 1</Table.Td>
                  <Table.Td style={tableStyles.td}>2x Pass Bet</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>4 & 10</Table.Td>
                  <Table.Td style={tableStyles.td}>2 : 1</Table.Td>
                  <Table.Td style={tableStyles.td}>2x Pass Bet</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>5 & 9</Table.Td>
                  <Table.Td style={tableStyles.td}>3 : 2 (1.5 : 1)</Table.Td>
                  <Table.Td style={tableStyles.td}>2x Pass Bet</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>6 & 8</Table.Td>
                  <Table.Td style={tableStyles.td}>6 : 5 (1.2 : 1)</Table.Td>
                  <Table.Td style={tableStyles.td}>2x Pass Bet</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          {/* Proposition / Hardways Tab */}
          <Tabs.Panel value="prop" pt="xs">
            <Text size="xs" c="dimmed" mb="sm">
              Hardways ride until resolved by a win, a seven-out, or rolling that number "easy" (not a pair). Prop hops are single-roll bets.
            </Text>
            <Table style={{ width: "100%" }}>
              <Table.Thead style={tableStyles.thead}>
                <Table.Tr>
                  <Table.Th style={tableStyles.th}>Bet Type</Table.Th>
                  <Table.Th style={tableStyles.th}>Numbers Covered</Table.Th>
                  <Table.Th style={tableStyles.th}>Payout Odds</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Field Bet</Table.Td>
                  <Table.Td style={tableStyles.td}>3, 4, 9, 10, 11 (Even) | 2, 12 (Double)</Table.Td>
                  <Table.Td style={tableStyles.td}>1 : 1 | 2 : 1</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Horn Bet (2/12)</Table.Td>
                  <Table.Td style={tableStyles.td}>2 or 12</Table.Td>
                  <Table.Td style={tableStyles.td}>30 : 1</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Horn Bet (3/11)</Table.Td>
                  <Table.Td style={tableStyles.td}>3 or 11</Table.Td>
                  <Table.Td style={tableStyles.td}>15 : 1</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Hop Double</Table.Td>
                  <Table.Td style={tableStyles.td}>Unordered Pair Double (e.g. 3-3)</Table.Td>
                  <Table.Td style={tableStyles.td}>30 : 1</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Hop Easy</Table.Td>
                  <Table.Td style={tableStyles.td}>Unordered Pair Easy (e.g. 1-2)</Table.Td>
                  <Table.Td style={tableStyles.td}>15 : 1</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Hard 4 & 10</Table.Td>
                  <Table.Td style={tableStyles.td}>Rolled as 2-2 or 5-5</Table.Td>
                  <Table.Td style={tableStyles.td}>7 : 1</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td style={tableStyles.td}>Hard 6 & 8</Table.Td>
                  <Table.Td style={tableStyles.td}>Rolled as 3-3 or 4-4</Table.Td>
                  <Table.Td style={tableStyles.td}>9 : 1</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>

        <Divider color={clubTokens.surface.brassStroke} />

        <ClubButton onClick={onClose} variant="filled" size="md" fullWidth>
          Back to felt
        </ClubButton>
      </Stack>
    </Modal>
  );
}
