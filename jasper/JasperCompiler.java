import net.sf.jasperreports.engine.JasperCompileManager;

public class JasperCompiler {
    public static void main(String[] args) {
        if (args.length != 2) {
            System.out.println("Usage: JasperCompiler <input.jrxml> <output.jasper>");
            System.exit(1);
        }
        String jrxml = args[0];
        String jasper = args[1];
        try {
            JasperCompileManager.compileReportToFile(jrxml, jasper);
            System.out.println("Compiled successfully: " + jasper);
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(2);
        }
    }
}
