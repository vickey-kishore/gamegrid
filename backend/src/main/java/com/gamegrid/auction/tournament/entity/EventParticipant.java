package com.gamegrid.auction.tournament.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_participants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private TournamentEvent event;

    @Column(name = "participant_name", nullable = false)
    private String participantName; // "Player Name" or "Player1 / Player2"

    @Column(name = "player1_name", nullable = false)
    private String player1Name;

    @Column(name = "player2_name")
    private String player2Name; // NULL for Singles

    @Column(name = "club_name")
    private String clubName;

    @Column(name = "seed_number")
    private Integer seedNumber;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
