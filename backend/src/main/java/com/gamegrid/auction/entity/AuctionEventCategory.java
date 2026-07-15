package com.gamegrid.auction.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "auction_event_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionEventCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
