#!/bin/sh
#====================================================================================================
#
# Compares locale strings to English strings, and identifies "missing" and "extra" keys.
# Missing keys are those that are present in English, but not in locale.
# Extra keys are those that are present in locale, but not in English.
#
# Usage: ../chipper/bin/clean-strings.sh
#
# Author: Chris Malley (PixelZoom, Inc.)
#
#====================================================================================================

# Verify that package.json exists, so we can read the sim name.
PACKAGE_JSON=./package.json
if [ ! -f $PACKAGE_JSON ]; then
    echo "Cannot find $PACKAGE_JSON" ; exit 1
fi

# Read build configuration from package.json.
function parseJSON() {
  echo `grep $1 ${PACKAGE_JSON} | awk -F ':' '{print $2}' | tr ",\"" " "`
}
NAME=`parseJSON name`

# Get the list of locales
LOCALES=`grep ':' nls/${NAME}-strings.js | tr -d \"\' | cut -f 1,1 -d : | tr -d ' ' | sort`

# Gets a sorted list of keys for $1 locale
function getStringKeys() {
  echo `grep ':' nls/${1}/${NAME}-strings.js | tr -d \"\' | cut -f 1,1 -d : | tr -d ' ' | sort`
}

# Get a sorted list of English keys
ENGLISH_KEYS=`getStringKeys root`

for locale in $LOCALES; do
  if [ $locale != "root" ]; then

    LOCALE_KEYS=`getStringKeys $locale`

    # Identify keys that are missing from locale
    echo ${locale} \(missing\):

    for englishKey in $ENGLISH_KEYS; do
      found="false";
      for localeKey in $LOCALE_KEYS; do
        if [ "$localeKey" == "$englishKey" ]; then
          found="true"
          break
        fi
      done
      if [ "$found" == "false" ]; then
        echo ${englishKey}
      fi
    done

    echo

    # Identify keys that are extras (in locale but not in English strings)
    echo ${locale} \(extras\):
    for localeKey in $LOCALE_KEYS; do
      found="false";
      for englishKey in $ENGLISH_KEYS; do
        if [ "$localeKey" == "$englishKey" ]; then
          found="true"
          break
        fi
      done
      if [ "$found" == "false" ]; then
        echo ${localeKey}
      fi
    done

    echo
  fi
done

#====================================================================================================