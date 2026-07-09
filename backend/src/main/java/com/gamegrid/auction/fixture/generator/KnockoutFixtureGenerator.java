package com.gamegrid.auction.fixture.generator;

import com.gamegrid.auction.tournament.entity.EventParticipant;
import com.gamegrid.auction.tournament.entity.TournamentEvent;
import com.gamegrid.auction.fixture.entity.FixtureMatch;
import java.util.*;

public class KnockoutFixtureGenerator {

    public static List<FixtureMatch> generate(TournamentEvent event, List<EventParticipant> participants) {
        int n = participants.size();
        if (n < 2) {
            throw new IllegalArgumentException("At least 2 participants are required to generate knockout fixtures.");
        }

        // Find next power of 2
        int p = 2;
        while (p < n) {
            p *= 2;
        }

        int byesCount = p - n;

        // Initialize bracket slots of size p
        EventParticipant[] slots = new EventParticipant[p];

        // Group participants into seeded and unseeded
        List<EventParticipant> seeded = new ArrayList<>();
        List<EventParticipant> unseeded = new ArrayList<>();
        for (EventParticipant ep : participants) {
            if (ep.getSeedNumber() != null && ep.getSeedNumber() >= 1 && ep.getSeedNumber() <= 8) {
                seeded.add(ep);
            } else {
                unseeded.add(ep);
            }
        }

        // Sort seeded by seed number
        seeded.sort(Comparator.comparing(EventParticipant::getSeedNumber));

        // Place seeds in their standard slots
        for (EventParticipant ep : seeded) {
            int seed = ep.getSeedNumber();
            if (seed == 1 && 0 < p) slots[0] = ep;
            else if (seed == 2 && p - 1 < p) slots[p - 1] = ep;
            else if (seed == 3 && p / 2 < p) slots[p / 2] = ep;
            else if (seed == 4 && p / 2 - 1 >= 0) slots[p / 2 - 1] = ep;
            else if (seed == 5 && p / 4 < p) slots[p / 4] = ep;
            else if (seed == 6 && 3 * p / 4 - 1 >= 0) slots[3 * p / 4 - 1] = ep;
            else if (seed == 7 && 3 * p / 4 < p) slots[3 * p / 4] = ep;
            else if (seed == 8 && p / 4 - 1 >= 0) slots[p / 4 - 1] = ep;
        }

        // Define Priority slots for Byes
        List<Integer> byePrioritySlots = new ArrayList<>();
        byePrioritySlots.add(1);             // Opponent of Seed 1 (Slot 0)
        byePrioritySlots.add(p - 2);         // Opponent of Seed 2 (Slot p-1)
        byePrioritySlots.add(p / 2 + 1);     // Opponent of Seed 3 (Slot p/2)
        byePrioritySlots.add(p / 2 - 2);     // Opponent of Seed 4 (Slot p/2 - 1)
        byePrioritySlots.add(p / 4 + 1);     // Opponent of Seed 5 (Slot p/4)
        byePrioritySlots.add(3 * p / 4 - 2); // Opponent of Seed 6 (Slot 3p/4 - 1)
        byePrioritySlots.add(3 * p / 4 + 1); // Opponent of Seed 7 (Slot 3p/4)
        byePrioritySlots.add(p / 4 - 2);     // Opponent of Seed 8 (Slot p/4 - 1)

        // Add remaining odd slots as lower priority for byes
        for (int i = 1; i < p; i += 2) {
            if (!byePrioritySlots.contains(i)) {
                byePrioritySlots.add(i);
            }
        }

        // Identify which slots are locked for Byes
        Set<Integer> byeSlots = new HashSet<>();
        int byesAllocated = 0;
        for (int slot : byePrioritySlots) {
            if (byesAllocated >= byesCount) break;
            // Check if slot is empty (not occupied by a seed)
            if (slots[slot] == null) {
                byeSlots.add(slot);
                byesAllocated++;
            }
        }

        // Shuffle unseeded players to randomize the draw
        Collections.shuffle(unseeded);
        int unseededIdx = 0;

        // Fill remaining slots
        for (int i = 0; i < p; i++) {
            if (slots[i] == null && !byeSlots.contains(i)) {
                if (unseededIdx < unseeded.size()) {
                    slots[i] = unseeded.get(unseededIdx++);
                }
            }
        }

        List<FixtureMatch> matches = new ArrayList<>();
        int numRounds = (int) (Math.log(p) / Math.log(2));

        // Create Round 1 Matches
        int round1MatchesCount = p / 2;
        FixtureMatch[] roundMatches = new FixtureMatch[round1MatchesCount];

        for (int i = 0; i < round1MatchesCount; i++) {
            EventParticipant p1 = slots[2 * i];
            EventParticipant p2 = slots[2 * i + 1];

            FixtureMatch match = FixtureMatch.builder()
                    .event(event)
                    .roundNumber(1)
                    .matchNumber(i + 1)
                    .participant1(p1)
                    .participant2(p2)
                    .build();

            // Auto progress Winner if Bye exists
            if (p1 == null && p2 != null) {
                match.setWinner(p2);
            } else if (p2 == null && p1 != null) {
                match.setWinner(p1);
            }

            roundMatches[i] = match;
            matches.add(match);
        }

        // Generate subsequent rounds
        FixtureMatch[] prevRoundMatches = roundMatches;
        for (int r = 2; r <= numRounds; r++) {
            int currentRoundMatchesCount = p / (int) Math.pow(2, r);
            FixtureMatch[] currentRoundMatches = new FixtureMatch[currentRoundMatchesCount];

            for (int i = 0; i < currentRoundMatchesCount; i++) {
                FixtureMatch match1 = prevRoundMatches[2 * i];
                FixtureMatch match2 = prevRoundMatches[2 * i + 1];

                EventParticipant p1 = match1.getWinner(); // Prefilled if Bye occurred
                EventParticipant p2 = match2.getWinner(); // Prefilled if Bye occurred

                FixtureMatch match = FixtureMatch.builder()
                        .event(event)
                        .roundNumber(r)
                        .matchNumber(i + 1)
                        .participant1(p1)
                        .participant2(p2)
                        .build();

                // If both feed-in matches have winners, progress if one is Bye
                if (p1 != null && p2 == null && match2.getParticipant1() == null && match2.getParticipant2() == null) {
                    // Match 2 was double Bye (unlikely)
                    match.setWinner(p1);
                }

                currentRoundMatches[i] = match;
                matches.add(match);
            }
            prevRoundMatches = currentRoundMatches;
        }

        return matches;
    }
}
