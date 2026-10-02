package com.aquora.mysql_backend.service;
import com.aquora.mysql_backend.dto.BorewellReadingResponse;
import com.aquora.mysql_backend.entity.BorewellReadings;
import com.aquora.mysql_backend.repository.BorewellReadingsRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.*;
@Service public class BorewellService{
 private final BorewellReadingsRepository repo; public BorewellService(BorewellReadingsRepository repo){this.repo=repo;}
 public BorewellReadingResponse latest(String id){BorewellReadings r=repo.findTopByDeviceIdOrderByTimestampDesc(id).orElseThrow(()->new IllegalArgumentException("No reading found for "+id));return BorewellReadingResponse.from(r);}
 public List<BorewellReadingResponse> history(String id,int limit){int n=Math.max(1,Math.min(limit,1000));return repo.findByDeviceIdOrderByTimestampDesc(id,PageRequest.of(0,n)).stream().map(BorewellReadingResponse::from).toList();}
}
