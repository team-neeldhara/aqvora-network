package com.aquora.mysql_backend.dto;
import com.aquora.mysql_backend.entity.BorewellReadings;
import java.time.LocalDateTime;
import java.util.*;
public record BorewellReadingResponse(String deviceId,String dt,LocalDateTime timestamp,Double waterLevel,Telemetry telemetry,MlAnalytics mlAnalytics){
 public record Telemetry(Double voltageRms,Double currentRms,Double powerFactor,Double frequency,Double unbalancePct){}
 public record MlAnalytics(Double healthScore,Double anomalyScore,Double confidence,Double dynamicThreshold,List<String> activeFaults,Boolean conceptDriftDetected){}
 public static BorewellReadingResponse from(BorewellReadings r){return new BorewellReadingResponse(r.getDeviceId(),r.getDt(),r.getTimestamp(),r.getWaterLevel(),new Telemetry(r.getVoltageRms(),r.getCurrentRms(),r.getPowerFactor(),r.getFrequency(),r.getUnbalancePct()),new MlAnalytics(r.getHealthScore(),r.getAnomalyScore(),r.getConfidence(),r.getDynamicThreshold(),parseFaults(r.getActiveFault()),r.getConceptDriftDetected()));}
 public static List<String> parseFaults(String value){if(value==null||value.isBlank())return List.of("NONE");String v=value.trim();if(v.startsWith("[")&&v.endsWith("]")){v=v.substring(1,v.length()-1).trim();if(v.isBlank())return List.of("NONE");return Arrays.stream(v.split(",")).map(x->x.trim().replace("\"","")).filter(x->!x.isBlank()).toList();}return List.of(v);}
}
