package com.gamegrid.auction.tournament.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "event_type", nullable = false)
    private String eventType; // 'Singles', 'Doubles'

    @Column(name = "fixture_type", nullable = false)
    private String fixtureType; // 'Knockout', 'League'

    @Column(name = "scoring_type", nullable = false)
    private String scoringType; // '21 Points - Best of 3', etc.

    @Column(name = "points_per_set")
    private Integer pointsPerSet;

    @Column(name = "number_of_sets")
    private Integer numberOfSets;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
