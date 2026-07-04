package com.gamegrid.auction.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "auction_teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "logo_path")
    private String logoPath;

    @Column(name = "purse_amount", nullable = false)
    private BigDecimal purseAmount;

    @Column(name = "remaining_purse", nullable = false)
    private BigDecimal remainingPurse;

    @Column(name = "minimum_players", nullable = false)
    private Integer minimumPlayers;

    @Column(name = "maximum_players", nullable = false)
    private Integer maximumPlayers;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
