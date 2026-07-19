package com.gamegrid.auction.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "auctions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auction_name", nullable = false)
    private String auctionName;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(nullable = false)
    private String category;

    @Column(name = "auction_date")
    private LocalDate auctionDate;

    @Column(name = "minimum_bid", nullable = false)
    private BigDecimal minimumBid;

    @Column(name = "bid_increment", nullable = false)
    private BigDecimal bidIncrement;

    @Column(name = "maximum_bid")
    private BigDecimal maximumBid;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    private AuctionStatus status;

    @Column(columnDefinition = "TEXT")
    private String events;

    @Column(name = "roster_rules", columnDefinition = "TEXT")
    @Convert(converter = RosterRulesConverter.class)
    @Builder.Default
    private java.util.List<RosterRule> rosterRules = new java.util.ArrayList<>();

    @Column(name = "allow_retention", nullable = false)
    @Builder.Default
    private boolean allowRetention = false;

    @Column(name = "max_retained_players")
    private Integer maxRetainedPlayers = 0;

    @Column(name = "retention_price")
    private BigDecimal retentionPrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
