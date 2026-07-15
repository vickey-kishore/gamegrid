package com.gamegrid.auction.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roster_category_constraints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RosterCategoryConstraint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
