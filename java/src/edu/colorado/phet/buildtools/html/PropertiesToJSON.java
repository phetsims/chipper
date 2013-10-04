package edu.colorado.phet.buildtools.html;

import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Properties;


/**
 * Converts .properties files to json
 * Usage:
 * args[0] is the source localization directory, such as "C:\workingcopy\phet\svn-1.7\trunk\simulations-java\simulations\energy-skate-park\data\energy-skate-park\localization"
 * args[1] is the target nls root such as "C:\workingcopy\phet\svn-1.7\trunk\simulations-html5\simulations\energy-skate-park\strings"
 *
 * @author Sam Reid
 */
public class PropertiesToJSON {
    public static void main( final String[] args ) throws IOException {

        //Source is the localization directory, such as "C:\workingcopy\phet\svn-1.7\trunk\simulations-java\simulations\energy-skate-park\data\energy-skate-park\localization"
        File source = new File( args[0] );

        //Destination is the target nls root, such as "C:\workingcopy\phet\svn-1.7\trunk\simulations-html5\simulations\energy-skate-park\strings"
        File destination = new File( args[1] );

        for ( final File file : source.listFiles( new FilenameFilter() {
            public boolean accept( final File dir, final String name ) {
                return name.endsWith( ".properties" ) && name.contains( "-strings" );
            }
        } ) ) {
            final boolean english = file.getName().indexOf( '_' ) < 0;
            Properties p = new Properties() {{
                load( new FileInputStream( file ) );
            }};
            String output = "{\n";
            for ( Object key : p.keySet() ) {
                String prefix = "    \"";
                output += prefix + key + "\": \"" + escape( p.get( key ).toString() ) + "\",\n";
            }

            //Remove the last comma
            output = output.substring( 0, output.lastIndexOf( ',' ) ) + output.substring( output.lastIndexOf( ',' ) + 1 );

            output += "}";

            System.out.println( output );
            System.out.println();
            System.out.println();
            System.out.println();

            final String tail = file.getName().substring( file.getName().indexOf( "_" ) + 1 );
            String localeAndCountry = english ? "en" : tail.substring( 0, tail.indexOf( '.' ) );

            String a = file.getName().substring( 0, file.getName().indexOf( "-strings" ) );
            String filename = a + "-strings_" + localeAndCountry.toLowerCase().replace( "_", "-" ) + ".json";

            FileUtils.writeString( new File( destination, filename ), output );
        }
    }

    private static String escape( final String s ) {
        //Replace " with \".  May need to add other escapes later on.
        return s.replace( "\"", "\\\"" ).replace( "\n", "\\n" );
    }

}