package com.gamegrid.auction.fixture.service;

import com.gamegrid.auction.tournament.entity.*;
import com.gamegrid.auction.tournament.repository.*;
import com.gamegrid.auction.tournament.dto.EventParticipantResponse;
import com.gamegrid.auction.fixture.entity.FixtureMatch;
import com.gamegrid.auction.fixture.dto.FixtureMatchResponse;
import com.gamegrid.auction.fixture.repository.FixtureMatchRepository;
import com.gamegrid.auction.fixture.generator.KnockoutFixtureGenerator;
import com.gamegrid.auction.fixture.generator.LeagueFixtureGenerator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FixtureService {

    private final TournamentEventRepository tournamentEventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final FixtureMatchRepository fixtureMatchRepository;

    @Transactional
    public List<FixtureMatchResponse> generateFixtures(Long eventId) {
        TournamentEvent event = tournamentEventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with ID: " + eventId));

        List<EventParticipant> participants = eventParticipantRepository.findByEventId(eventId);
        if (participants.size() < 2) {
            throw new IllegalArgumentException("At least 2 participants are registered to generate fixtures.");
        }

        // Clear existing fixtures
        fixtureMatchRepository.deleteByEventId(eventId);
        fixtureMatchRepository.flush();

        List<FixtureMatch> generated;
        if ("Knockout".equalsIgnoreCase(event.getFixtureType())) {
            generated = KnockoutFixtureGenerator.generate(event, participants);
        } else {
            generated = LeagueFixtureGenerator.generate(event, participants);
        }

        List<FixtureMatch> saved = fixtureMatchRepository.saveAll(generated);
        return saved.stream().map(this::mapToMatchResponse).collect(Collectors.toList());
    }

    public List<FixtureMatchResponse> getFixturesForEvent(Long eventId) {
        return fixtureMatchRepository.findByEventIdOrderByRoundNumberAscMatchNumberAsc(eventId).stream()
                .map(this::mapToMatchResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FixtureMatchResponse updateMatchWinner(Long matchId, Long winnerId) {
        FixtureMatch match = fixtureMatchRepository.findById(matchId)
                .orElseThrow(() -> new EntityNotFoundException("Match not found with ID: " + matchId));

        EventParticipant winner = null;
        if (winnerId != null) {
            if (match.getParticipant1() != null && match.getParticipant1().getId().equals(winnerId)) {
                winner = match.getParticipant1();
            } else if (match.getParticipant2() != null && match.getParticipant2().getId().equals(winnerId)) {
                winner = match.getParticipant2();
            } else {
                throw new IllegalArgumentException("Winner must be one of the match participants.");
            }
        }

        match.setWinner(winner);
        FixtureMatch savedMatch = fixtureMatchRepository.save(match);

        // If it is Knockout, propagate winner to the next round
        TournamentEvent event = match.getEvent();
        if ("Knockout".equalsIgnoreCase(event.getFixtureType()) && winner != null) {
            int round = match.getRoundNumber();
            int matchNum = match.getMatchNumber();

            int nextRound = round + 1;
            int nextMatchNum = (matchNum + 1) / 2;
            boolean isP1 = (matchNum % 2 != 0);

            Optional<FixtureMatch> nextMatchOpt = fixtureMatchRepository
                    .findByEventIdAndRoundNumberAndMatchNumber(event.getId(), nextRound, nextMatchNum);

            if (nextMatchOpt.isPresent()) {
                FixtureMatch nextMatch = nextMatchOpt.get();
                if (isP1) {
                    nextMatch.setParticipant1(winner);
                } else {
                    nextMatch.setParticipant2(winner);
                }
                fixtureMatchRepository.save(nextMatch);
            }
        }

        return mapToMatchResponse(savedMatch);
    }

    @Transactional
    public FixtureMatchResponse updateMatchTimeAndCourt(Long matchId, LocalDateTime scheduledTime, String courtNumber) {
        FixtureMatch match = fixtureMatchRepository.findById(matchId)
                .orElseThrow(() -> new EntityNotFoundException("Match not found with ID: " + matchId));

        if (scheduledTime != null) {
            match.setScheduledTime(scheduledTime);
        }
        if (courtNumber != null) {
            match.setCourtNumber(courtNumber);
        }

        FixtureMatch saved = fixtureMatchRepository.save(match);
        return mapToMatchResponse(saved);
    }

    public String generateFixturesPdfHtml(Long eventId) {
        TournamentEvent event = tournamentEventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with ID: " + eventId));

        Tournament t = event.getTournament();
        List<FixtureMatch> matches = fixtureMatchRepository.findByEventIdOrderByRoundNumberAscMatchNumberAsc(eventId);

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Fixtures - ").append(event.getEventName()).append("</title>");
        sb.append("<style>");
        sb.append("body { font-family: 'Rajdhani', sans-serif; background-color: #0b0f19; color: #ffffff; padding: 30px; margin: 0; }");
        sb.append(".header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #00f0ff; padding-bottom: 20px; margin-bottom: 30px; }");
        sb.append(".title-section { display: flex; flex-direction: column; }");
        sb.append("h1 { color: #00f0ff; margin: 0 0 5px 0; font-size: 28px; }");
        sb.append("h2 { color: #ffffff; margin: 0; font-size: 20px; }");
        sb.append(".organizer-info { text-align: right; color: #94a3b8; font-size: 14px; }");
        sb.append(".logo { max-width: 80px; max-height: 80px; border-radius: 6px; }");
        sb.append(".watermark { position: fixed; bottom: 20px; right: 20px; font-size: 14px; color: rgba(255,255,255,0.05); font-weight: bold; text-transform: uppercase; }");
        sb.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); }");
        sb.append("th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }");
        sb.append("th { background-color: #1e293b; color: #00f0ff; font-weight: bold; text-transform: uppercase; font-size: 14px; }");
        sb.append("tr:hover { background-color: rgba(255, 255, 255, 0.02); }");
        sb.append(".time-court { color: #e2e8f0; font-size: 13px; }");
        sb.append(".badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #3b82f6; color: white; }");
        sb.append(".winner { color: #10b981; font-weight: bold; }");
        sb.append("@media print { body { background-color: #ffffff; color: #000000; padding: 20px; } .header { border-bottom: 2px solid #000000; } h1 { color: #000000; } th { background-color: #f1f5f9; color: #000000; } table { background: none; border: 1px solid #cbd5e1; } td, th { border-bottom: 1px solid #cbd5e1; } .winner { color: #000000; } }");
        sb.append("</style></head><body>");

        sb.append("<div class='watermark'>game grid</div>");

        // Header section
        sb.append("<div class='header'>");
        sb.append("<div style='display:flex; align-items:center; gap:20px;'>");
        if (t.getLogoPath() != null && !t.getLogoPath().isEmpty()) {
            sb.append("<img class='logo' src='/").append(t.getLogoPath()).append("' />");
        }
        sb.append("<div class='title-section'>");
        sb.append("<h1>").append(t.getName()).append("</h1>");
        sb.append("<h2>Fixture Draw: ").append(event.getEventName()).append(" (").append(event.getFixtureType()).append(")</h2>");
        sb.append("<div class='time-court'>Venue: ").append(t.getVenue()).append("</div>");
        sb.append("</div>");
        sb.append("</div>");
        sb.append("<div class='organizer-info'>");
        sb.append("<div>Organizer: ").append(t.getOrganizerName()).append("</div>");
        sb.append("<div>Contact: ").append(t.getOrganizerContact()).append("</div>");
        sb.append("</div>");
        sb.append("</div>");

        // Draw Table
        sb.append("<table><thead><tr>");
        sb.append("<th>Match No</th>");
        sb.append("<th>Round</th>");
        sb.append("<th>Participant 1</th>");
        sb.append("<th>Participant 2</th>");
        sb.append("<th>Scheduled Time</th>");
        sb.append("<th>Court</th>");
        sb.append("<th>Winner</th>");
        sb.append("</tr></thead><tbody>");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
        for (FixtureMatch m : matches) {
            String p1Name = m.getParticipant1() != null ? m.getParticipant1().getParticipantName() : "TBD / Bye";
            String p2Name = m.getParticipant2() != null ? m.getParticipant2().getParticipantName() : "TBD / Bye";
            String timeStr = m.getScheduledTime() != null ? m.getScheduledTime().format(formatter) : "—";
            String courtStr = m.getCourtNumber() != null ? m.getCourtNumber() : "—";
            String winnerStr = m.getWinner() != null ? m.getWinner().getParticipantName() : "—";

            sb.append("<tr>");
            sb.append("<td>").append(m.getMatchNumber()).append("</td>");
            sb.append("<td><span class='badge'>Round ").append(m.getRoundNumber()).append("</span></td>");
            sb.append("<td>").append(p1Name).append("</td>");
            sb.append("<td>").append(p2Name).append("</td>");
            sb.append("<td class='time-court'>").append(timeStr).append("</td>");
            sb.append("<td>").append(courtStr).append("</td>");
            sb.append("<td class='").append(m.getWinner() != null ? "winner" : "").append("'>").append(winnerStr).append("</td>");
            sb.append("</tr>");
        }

        sb.append("</tbody></table>");
        sb.append("<script>window.onload = function() { window.print(); }</script>");
        sb.append("</body></html>");

        return sb.toString();
    }

    private FixtureMatchResponse mapToMatchResponse(FixtureMatch m) {
        return FixtureMatchResponse.builder()
                .id(m.getId())
                .eventId(m.getEvent().getId())
                .roundNumber(m.getRoundNumber())
                .matchNumber(m.getMatchNumber())
                .participant1(m.getParticipant1() != null ? mapToParticipantResponse(m.getParticipant1()) : null)
                .participant2(m.getParticipant2() != null ? mapToParticipantResponse(m.getParticipant2()) : null)
                .scheduledTime(m.getScheduledTime())
                .courtNumber(m.getCourtNumber())
                .winnerId(m.getWinner() != null ? m.getWinner().getId() : null)
                .winnerName(m.getWinner() != null ? m.getWinner().getParticipantName() : null)
                .build();
    }

    private EventParticipantResponse mapToParticipantResponse(EventParticipant p) {
        return EventParticipantResponse.builder()
                .id(p.getId())
                .eventId(p.getEvent().getId())
                .participantName(p.getParticipantName())
                .player1Name(p.getPlayer1Name())
                .player2Name(p.getPlayer2Name())
                .clubName(p.getClubName())
                .seedNumber(p.getSeedNumber())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
