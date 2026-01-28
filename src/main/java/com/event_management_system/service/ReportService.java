package com.event_management_system.service;

import net.sf.jasperreports.engine.JRException;
import java.util.List;
import java.util.Map;

public interface ReportService {
    byte[] generateEventsPdf(List<?> events, Map<String, Object> parameters) throws JRException;
}