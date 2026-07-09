package com.gamegrid.auction.fixture.generator;

import com.gamegrid.auction.tournament.entity.EventParticipant;
import com.gamegrid.auction.tournament.entity.TournamentEvent;
import com.gamegrid.auction.fixture.entity.FixtureMatch;
import java.util.*;

public class LeagueFixtureGenerator {

    public static List<FixtureMatch> generate(TournamentEvent event, List<EventParticipant> participants) {
        int n = participants.size();
        if (n < 2) {
            throw new IllegalArgumentException("At least 2 participants are required to generate round robin league fixtures.");
        }

        List<EventParticipant> list = new ArrayList<>(participants);
        // Shuffle list to randomize scheduling matches
        Collections.shuffle(list);

        if (list.size() % 2 != 0) {
            list.add(null); // Add virtual dummy for Bye scheduling
        }

        int numPlayers = list.size();
        int numRounds = numPlayers - 1;
        int matchesPerRound = numPlayers / 2;

        List<FixtureMatch> matches = new ArrayList<>();
        int matchSeq = 1;

        for (int round = 1; round <= numRounds; round++) {
            for (int i = 0; i < matchesPerRound; i++) {
                int p1Idx = (round - 1 + i) % (numPlayers - 1);
                int p2Idx = (numPlayers - 1 - i + round - 1) % (numPlayers - 1);

                if (i == 0) {
                    p1Idx = numPlayers - 1;
                }

                EventParticipant p1 = list.get(p1Idx);
                EventParticipant p2 = list.get(p2Idx);

                // Exclude matches involving the dummy player (represents a Bye round)
                if (p1 != null && p2 != null) {
                    FixtureMatch match = FixtureMatch.builder()
                            .event(event)
                            .roundNumber(round)
                            .matchNumber(matchSeq++)
                            .participant1(p1)
                            .participant2(p2)
                            .build();
                    matches.add(match);
                }
            }
        }

        return matches;
    }
}
