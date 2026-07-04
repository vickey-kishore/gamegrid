package com.gamegrid.auction.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoldRequest {
    @NotNull(message = "Auction ID is required")
    private Long auctionId;

    private Long teamId; // Optional: falls back to highest bid if null
    private BigDecimal soldPrice; // Optional: falls back to highest bid if null
}
