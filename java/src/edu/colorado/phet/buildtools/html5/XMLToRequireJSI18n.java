package edu.colorado.phet.buildtools.html5;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import javax.xml.parsers.ParserConfigurationException;

import org.xml.sax.SAXException;

/**
 * Convert Flash XML strings to JavaScript RequireJS i18n format, requires Java 7
 * Usage:
 * args[0] is the source path such as C:\workingcopy\phet\svn-1.7\trunk\simulations-flash\simulations\arithmetic\data\arithmetic\localization
 * args[1] is the destination path
 *
 * @author Sam Reid
 */
public class XMLToRequireJSI18n {
    public static void main( String[] args ) throws IOException, ParserConfigurationException, SAXException {
        Path tempDir = Files.createTempDirectory( "phet-xml-to-requirejs-temp" );

        System.out.println( "Converting XML to properties with temp path: " + tempDir );
        XMLToProperties.main( new String[]{args[0], tempDir.toFile().getAbsolutePath()} );

        System.out.println( "Converting Properties to RequireJS" );
        PropertiesToRequireJSI18n.main( new String[]{tempDir.toFile().getAbsolutePath(), args[1]} );

        System.out.println( "Done" );
    }
}
