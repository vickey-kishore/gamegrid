package com.gamegrid.auction.dto;

import com.gamegrid.auction.entity.PlayerStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionPlayerResponse {
    private Long id; // AuctionPlayer ID
    private Long playerId;
    private String name;
    private String phoneNumber;
    private String email;
    private String gender;
    private Integer age;
    private String category;
    private String city;
    private String state;
    private String skillLevel;
    private String photoPath;
    private String club;
    private BigDecimal basePrice;
    private PlayerStatus status;
    private BigDecimal soldPrice;
    private Long teamId;
    private String teamName;
    private LocalDateTime soldAt;
    private boolean isRetained;
    private Integer serialNumber;
}
