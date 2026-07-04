package com.gamegrid.auction.repository;

import com.gamegrid.auction.entity.AuctionTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionTeamRepository extends JpaRepository<AuctionTeam, Long> {
    List<AuctionTeam> findByAuctionId(Long auctionId);
    Optional<AuctionTeam> findByAuctionIdAndTeamNameIgnoreCase(Long auctionId, String teamName);
    boolean existsByAuctionIdAndTeamNameIgnoreCase(Long auctionId, String teamName);
}
