package com.gamegrid.auction.repository;

import com.gamegrid.auction.entity.AuctionEventCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuctionEventCategoryRepository extends JpaRepository<AuctionEventCategory, Long> {
}
