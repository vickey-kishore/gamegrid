package com.gamegrid.auction.dto;

import com.gamegrid.auction.entity.AuctionStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.gamegrid.auction.entity.RosterRule;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionResponse {
    private Long id;
    private String auctionName;
    private String eventName;
    private String category;
    private List<String> events;
    private List<RosterRule> rosterRules;
    private boolean allowRetention;
    private Integer maxRetainedPlayers;
    private LocalDate auctionDate;
    private String description;
    private BigDecimal minimumBid;
    private BigDecimal bidIncrement;
    private BigDecimal maximumBid;
    private AuctionStatus status;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TeamConfig> teams;
}
