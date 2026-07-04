package com.gamegrid.auction.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerRequest {
    @NotBlank(message = "Player name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String email;
    private String gender;
    private Integer age;

    @NotBlank(message = "Category is required")
    private String category;

    private String city;
    private String state;
    private String skillLevel;
    private String photoPath;
    private String club;
}
