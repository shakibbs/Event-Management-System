package com.event_management_system.service;

import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportServiceImpl implements ReportService {
    @Override
    public byte[] generateEventsPdf(List<?> events, Map<String, Object> parameters) throws JRException {
        InputStream jasperStream = this.getClass().getResourceAsStream("/events_list.jasper");
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(events);
        if (parameters == null) parameters = new HashMap<>();
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperStream, parameters, dataSource);
        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}
