package com.gamegrid.auction.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "phone_number", nullable = false, unique = true)
    private String phoneNumber;

    @Column(unique = true)
    private String email;

    private String gender;
    private Integer age;

    @Column(nullable = false)
    private String category;

    private String city;
    private String state;

    @Column(name = "skill_level")
    private String skillLevel;

    @Column(name = "photo_path")
    private String photoPath;

    private String club;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
