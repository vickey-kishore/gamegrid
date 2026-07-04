package com.gamegrid.auction.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidResponse {
    private Long id;
    private Long auctionId;
    private Long playerId;
    private Long teamId;
    private String teamName;
    private BigDecimal bidAmount;
    private LocalDateTime bidTime;
}
