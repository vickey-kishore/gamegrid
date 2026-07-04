package com.gamegrid.auction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionRequest {
    @NotBlank(message = "Auction name is required")
    private String auctionName;

    private String eventName;
    private String category;
    private List<String> events;
    private int minMen;
    private int minWomen;

    private LocalDate auctionDate;
    private String description;

    @NotNull(message = "Minimum bid is required")
    @DecimalMin(value = "0.0", message = "Minimum bid must be non-negative")
    private BigDecimal minimumBid;

    @NotNull(message = "Bid increment is required")
    @DecimalMin(value = "0.01", message = "Bid increment must be greater than zero")
    private BigDecimal bidIncrement;

    private BigDecimal maximumBid;

    @NotEmpty(message = "At least one team must be configured")
    @Size(min = 2, message = "There must be at least 2 teams configured")
    @Valid
    private List<TeamConfig> teams;
}
