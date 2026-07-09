package com.gamegrid.auction.tournament.repository;

import com.gamegrid.auction.tournament.entity.EventParticipant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    List<EventParticipant> findByEventId(Long eventId);
    Page<EventParticipant> findByEventId(Long eventId, Pageable pageable);
    
    // Check if participant name is duplicate inside event
    boolean existsByEventIdAndParticipantName(Long eventId, String participantName);
}
