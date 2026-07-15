package com.gamegrid.auction.repository;

import com.gamegrid.auction.entity.RosterCategoryConstraint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RosterCategoryConstraintRepository extends JpaRepository<RosterCategoryConstraint, Long> {
}
