package com.gamegrid.auction.fixture.entity;

import com.gamegrid.auction.tournament.entity.EventParticipant;
import com.gamegrid.auction.tournament.entity.TournamentEvent;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fixture_matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixtureMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private TournamentEvent event;

    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Column(name = "match_number", nullable = false)
    private int matchNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant1_id")
    private EventParticipant participant1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant2_id")
    private EventParticipant participant2;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Column(name = "court_number")
    private String courtNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private EventParticipant winner;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
