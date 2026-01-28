package com.event_management_system.util;

import net.sf.jasperreports.engine.JasperCompileManager;

public class JasperCompiler {
    public static void main(String[] args) throws Exception {
        String jrxml = "src/main/resources/events_list.jrxml";
        String jasper = "src/main/resources/events_list.jasper";
        JasperCompileManager.compileReportToFile(jrxml, jasper);
        System.out.println("Compiled: " + jasper);
    }
}
