// Copyright 2002-2013, University of Colorado Boulder

package edu.colorado.phet.buildtools.html;

import java.io.File;
import java.io.FileFilter;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.StringTokenizer;

/**
 * Created by Sam on 9/18/13.
 */
public class GenerateLicenseHeader {
    public static void main( String[] args ) throws IOException {
        File dir = new File( "C:\\Users\\Sam\\Documents\\GitHub\\chipper\\licenses" );
        String s = "";
        File[] files = dir.listFiles( new FileFilter() {
            @Override public boolean accept( File pathname ) {
                return pathname.isDirectory();
            }
        } );
        List<String> BLLExclude = Arrays.asList( "base64-binary", "howler", "json2", "numeric", "seedrandom", "tween","revealjs" );
        for ( int i = 0; i < files.length; i++ ) {
            File file = files[i];
            String dependencyName = file.getName();
            String parsed = FileUtils.loadFileAsString( new File( file, "package.json" ) );
            String licenseType = getLicenseType( parsed );
            boolean appearsInSim = getProduction( parsed ) && !BLLExclude.contains( dependencyName );
//            System.out.println( file.getName() + ", LICENSE = " + licenseType + ", appearsinSim=" + appearsInSim );
            if ( appearsInSim ) {
                System.out.println( file.getName() + ", LICENSE = " + licenseType );
            }
            if ( appearsInSim ) {
                s = s + "\n######################################################\n";
                s = s + file.getName() + ": " + licenseType + "\n";
                s = s + FileUtils.loadFileAsString( new File( file, "license.txt" ) );
                s = s + "\n";
            }
//            System.out.println( FileUtils.loadFileAsString( new File( file, "license.txt" ) ) );
        }

        s = s.trim();
        System.out.println( s );
    }

    private static boolean getProduction( String parsed ) {
        StringTokenizer st = new StringTokenizer( parsed, ":}" );
        st.nextToken();
        st.nextToken();
        String s = st.nextToken().trim();
        return Boolean.parseBoolean( s );
    }

    private static String getLicenseType( String parsed ) {
        StringTokenizer st = new StringTokenizer( parsed, ":," );
        st.nextToken();
        String s = st.nextToken();
        return s.replace( '"', ' ' ).trim().toUpperCase();
    }
}
