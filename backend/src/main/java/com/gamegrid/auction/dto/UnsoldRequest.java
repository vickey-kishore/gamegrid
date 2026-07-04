package com.gamegrid.auction.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnsoldRequest {
    @NotNull(message = "Auction ID is required")
    private Long auctionId;
}
