package edu.colorado.phet.buildtools.html5;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Properties;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * Transform Flash XML string translations to Java properties format.
 */
public class XMLToProperties {
    public static void main( String[] args ) throws IOException, ParserConfigurationException, SAXException {
        //Source is the localization directory, such as "C:\workingcopy\phet\svn-1.7\trunk\simulations-java\simulations\energy-skate-park\data\energy-skate-park\localization"
        File source = new File( args[0] );

        //Destination is the target nls root, such as "C:\workingcopy\phet\svn-1.7\trunk\simulations-html5\simulations\energy-skate-park-easeljs-jquerymobile\src\app\nls"
        File destination = new File( args[1] );
        destination.mkdirs();

        for ( File file : source.listFiles( new FilenameFilter() {
            public boolean accept( File dir, String name ) {
                return name.endsWith( ".xml" );
            }
        } ) ) {
            Properties s = documentToProperties( DocumentBuilderFactory.newInstance().newDocumentBuilder().parse( new FileInputStream( file ) ) );
            File destFile = new File( destination, file.getName().replace( ".xml", ".properties" ).replace( "_en.properties", ".properties" ) );
            String header = "";
            // write properties to file
            OutputStream outputStream = new FileOutputStream( destFile );
            s.store( outputStream, header );
            outputStream.close();
        }
    }

    public static final Properties documentToProperties( Document document ) {
        Properties properties = new Properties();
        NodeList elements = document.getElementsByTagName( "string" );
        int numberOfNodes = elements.getLength();
        for ( int i = 0; i < numberOfNodes; i++ ) {
            Element element = (Element) elements.item( i );
            String key = element.getAttribute( "key" );
            String value = element.getAttribute( "value" );
            properties.setProperty( key, value );
        }
        return properties;
    }
}
