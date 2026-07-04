package com.gamegrid.auction.repository;

import com.gamegrid.auction.entity.Auction;
import com.gamegrid.auction.entity.AuctionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long>, JpaSpecificationExecutor<Auction> {
    
    @Query("SELECT a FROM Auction a WHERE a.id = :id AND a.isDeleted = false")
    Optional<Auction> findActiveById(@Param("id") Long id);

    @Query("SELECT a FROM Auction a WHERE a.isDeleted = false")
    Page<Auction> findAllActive(Pageable pageable);

    @Query("SELECT a FROM Auction a WHERE a.isDeleted = false AND a.status = :status")
    Page<Auction> findAllActiveByStatus(@Param("status") AuctionStatus status, Pageable pageable);
}
