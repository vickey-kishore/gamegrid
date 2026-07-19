package com.gamegrid.auction.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "auction_players")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionPlayer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    private PlayerStatus status = PlayerStatus.Available;

    @Column(name = "sold_price")
    private BigDecimal soldPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private AuctionTeam team;

    @Column(name = "sold_at")
    private LocalDateTime soldAt;

    @Builder.Default
    @Column(name = "is_retained", nullable = false)
    private boolean isRetained = false;

    @Column(name = "serial_number")
    private Integer serialNumber;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
