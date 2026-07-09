package com.gamegrid.auction.tournament.service;

import com.gamegrid.auction.tournament.dto.*;
import com.gamegrid.auction.tournament.entity.*;
import com.gamegrid.auction.tournament.repository.*;
import com.gamegrid.auction.fixture.repository.FixtureMatchRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.criteria.Predicate;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TournamentEventRepository tournamentEventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final FixtureMatchRepository fixtureMatchRepository;

    @Transactional
    public TournamentResponse createTournament(TournamentRequest request) {
        Tournament tournament = Tournament.builder()
                .name(request.getName())
                .venue(request.getVenue())
                .logoPath(request.getLogoPath())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .entryFee(request.getEntryFee())
                .organizerName(request.getOrganizerName())
                .organizerContact(request.getOrganizerContact())
                .description(request.getDescription())
                .build();

        Tournament saved = tournamentRepository.save(tournament);
        return mapToTournamentResponse(saved);
    }

    public TournamentResponse getTournament(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tournament not found with ID: " + id));
        return mapToTournamentResponse(tournament);
    }

    public Page<TournamentResponse> getTournamentsPage(String search, Pageable pageable) {
        Specification<Tournament> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("venue")), searchPattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return tournamentRepository.findAll(spec, pageable).map(this::mapToTournamentResponse);
    }

    @Transactional
    public TournamentResponse updateTournament(Long id, TournamentRequest request) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tournament not found with ID: " + id));

        tournament.setName(request.getName());
        tournament.setVenue(request.getVenue());
        if (request.getLogoPath() != null) {
            tournament.setLogoPath(request.getLogoPath());
        }
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        tournament.setEntryFee(request.getEntryFee());
        tournament.setOrganizerName(request.getOrganizerName());
        tournament.setOrganizerContact(request.getOrganizerContact());
        tournament.setDescription(request.getDescription());

        Tournament saved = tournamentRepository.save(tournament);
        return mapToTournamentResponse(saved);
    }

    @Transactional
    public void deleteTournament(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tournament not found with ID: " + id));
        tournamentRepository.delete(tournament);
    }

    @Transactional
    public EventResponse createEvent(Long tournamentId, EventRequest request) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new EntityNotFoundException("Tournament not found with ID: " + tournamentId));

        TournamentEvent event = TournamentEvent.builder()
                .tournament(tournament)
                .eventName(request.getEventName())
                .eventType(request.getEventType())
                .fixtureType(request.getFixtureType())
                .scoringType(request.getScoringType())
                .pointsPerSet(request.getPointsPerSet())
                .numberOfSets(request.getNumberOfSets())
                .build();

        TournamentEvent saved = tournamentEventRepository.save(event);
        return mapToEventResponse(saved);
    }

    public List<EventResponse> getEventsForTournament(Long tournamentId) {
        return tournamentEventRepository.findByTournamentId(tournamentId).stream()
                .map(this::mapToEventResponse)
                .collect(Collectors.toList());
    }

    public Page<EventParticipantResponse> getParticipantsForEvent(Long eventId, Pageable pageable) {
        return eventParticipantRepository.findByEventId(eventId, pageable)
                .map(this::mapToParticipantResponse);
    }

    @Transactional
    public EventParticipantResponse registerParticipant(Long eventId, ParticipantRegistrationRequest request) {
        TournamentEvent event = tournamentEventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with ID: " + eventId));

        boolean isDoubles = "Doubles".equalsIgnoreCase(event.getEventType());
        String player1 = request.getPlayer1Name().trim();
        String player2 = request.getPlayer2Name() != null ? request.getPlayer2Name().trim() : "";

        if (isDoubles && player2.isEmpty()) {
            throw new IllegalArgumentException("Partner's name is required for doubles events");
        }

        String participantName = isDoubles ? player1 + " / " + player2 : player1;

        if (eventParticipantRepository.existsByEventIdAndParticipantName(eventId, participantName)) {
            throw new IllegalArgumentException("Participant '" + participantName + "' is already registered for this event");
        }

        EventParticipant participant = EventParticipant.builder()
                .event(event)
                .participantName(participantName)
                .player1Name(player1)
                .player2Name(isDoubles ? player2 : null)
                .clubName(request.getClubName())
                .build();

        EventParticipant saved = eventParticipantRepository.save(participant);
        return mapToParticipantResponse(saved);
    }

    @Transactional
    public EventParticipantResponse updateParticipantSeed(Long id, Integer seedNumber) {
        EventParticipant participant = eventParticipantRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found with ID: " + id));
        
        participant.setSeedNumber(seedNumber);
        EventParticipant saved = eventParticipantRepository.save(participant);
        return mapToParticipantResponse(saved);
    }

    @Transactional
    public void uploadParticipantsExcel(Long eventId, MultipartFile file) {
        TournamentEvent event = tournamentEventRepository.findById(eventId)
                .orElseThrow(() -> new EntityNotFoundException("Event not found with ID: " + eventId));

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (!rows.hasNext()) {
                throw new IllegalArgumentException("Uploaded Excel sheet is empty.");
            }

            // Parse header row
            Row headerRow = rows.next();
            Map<String, Integer> headerMap = new HashMap<>();
            for (Cell cell : headerRow) {
                if (cell != null && cell.getCellType() == CellType.STRING) {
                    headerMap.put(cell.getStringCellValue().trim().toLowerCase(), cell.getColumnIndex());
                }
            }

            boolean isDoubles = "Doubles".equalsIgnoreCase(event.getEventType());
            List<EventParticipant> participantsToSave = new ArrayList<>();

            while (rows.hasNext()) {
                Row row = rows.next();
                if (isRowEmpty(row)) continue;

                String player1 = null;
                String player2 = null;
                String club = null;

                if (isDoubles) {
                    Integer p1Col = getColumnIndex(headerMap, "player 1", "player1", "p1");
                    Integer p2Col = getColumnIndex(headerMap, "player 2", "player2", "p2");
                    Integer clubCol = getColumnIndex(headerMap, "club", "club name", "club_name");

                    if (p1Col != null) player1 = getCellValueAsString(row.getCell(p1Col));
                    if (p2Col != null) player2 = getCellValueAsString(row.getCell(p2Col));
                    if (clubCol != null) club = getCellValueAsString(row.getCell(clubCol));

                    if (player1 == null || player1.isEmpty() || player2 == null || player2.isEmpty()) {
                        continue; // Skip invalid records
                    }
                } else {
                    Integer pCol = getColumnIndex(headerMap, "player name", "name", "player", "player1");
                    Integer clubCol = getColumnIndex(headerMap, "club", "club name", "club_name");

                    if (pCol != null) player1 = getCellValueAsString(row.getCell(pCol));
                    if (clubCol != null) club = getCellValueAsString(row.getCell(clubCol));

                    if (player1 == null || player1.isEmpty()) {
                        continue; // Skip invalid records
                    }
                }

                String participantName = isDoubles ? player1 + " / " + player2 : player1;
                
                // Avoid duplicates in the same upload batch or database
                if (eventParticipantRepository.existsByEventIdAndParticipantName(eventId, participantName)) {
                    continue; // Skip duplicates
                }

                EventParticipant participant = EventParticipant.builder()
                        .event(event)
                        .participantName(participantName)
                        .player1Name(player1)
                        .player2Name(player2)
                        .clubName(club)
                        .build();

                participantsToSave.add(participant);
            }

            if (!participantsToSave.isEmpty()) {
                eventParticipantRepository.saveAll(participantsToSave);
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    private Integer getColumnIndex(Map<String, Integer> headerMap, String... aliases) {
        for (String alias : aliases) {
            if (headerMap.containsKey(alias)) {
                return headerMap.get(alias);
            }
        }
        return null;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return String.valueOf((int) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }

    private TournamentResponse mapToTournamentResponse(Tournament t) {
        int count = tournamentEventRepository.findByTournamentId(t.getId()).size();
        return TournamentResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .venue(t.getVenue())
                .logoPath(t.getLogoPath())
                .startDate(t.getStartDate())
                .endDate(t.getEndDate())
                .entryFee(t.getEntryFee())
                .organizerName(t.getOrganizerName())
                .organizerContact(t.getOrganizerContact())
                .description(t.getDescription())
                .eventsCount(count)
                .build();
    }

    private EventResponse mapToEventResponse(TournamentEvent e) {
        int count = eventParticipantRepository.findByEventId(e.getId()).size();
        boolean fixturesGen = !fixtureMatchRepository.findByEventId(e.getId()).isEmpty();
        return EventResponse.builder()
                .id(e.getId())
                .tournamentId(e.getTournament().getId())
                .eventName(e.getEventName())
                .eventType(e.getEventType())
                .fixtureType(e.getFixtureType())
                .scoringType(e.getScoringType())
                .pointsPerSet(e.getPointsPerSet())
                .numberOfSets(e.getNumberOfSets())
                .participantsCount(count)
                .fixturesGenerated(fixturesGen)
                .build();
    }

    private EventParticipantResponse mapToParticipantResponse(EventParticipant p) {
        return EventParticipantResponse.builder()
                .id(p.getId())
                .eventId(p.getEvent().getId())
                .participantName(p.getParticipantName())
                .player1Name(p.getPlayer1Name())
                .player2Name(p.getPlayer2Name())
                .clubName(p.getClubName())
                .seedNumber(p.getSeedNumber())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
