package edu.colorado.phet.buildtools.html;

import java.io.File;

/**
 * Creates IMG tags for PNG, JPG and SVG for use with imagesloaded plugin
 *
 * @author Sam Reid
 */
public class CreateIMGTags {
    public static void main( String[] args ) {
        File dir = new File( args[0] );
        for ( int i = 0; i < dir.listFiles().length; i++ ) {
            File file = dir.listFiles()[i];
            String lowername = file.getName().toLowerCase();
            if ( lowername.endsWith( "png" ) ||
                 lowername.endsWith( "jpg" ) ||
                 lowername.endsWith( "svg" ) ) {
                System.out.println( "<img src=\"images/" + file.getName() + "\"/>" );
            }
        }
    }
}