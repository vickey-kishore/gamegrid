package com.gamegrid.auction.repository;

import com.gamegrid.auction.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByAuctionIdAndPlayerIdOrderByBidTimeDesc(Long auctionId, Long playerId);
    Optional<Bid> findTopByAuctionIdAndPlayerIdOrderByBidAmountDesc(Long auctionId, Long playerId);
    void deleteByAuctionId(Long auctionId);
}
