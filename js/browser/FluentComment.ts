// Copyright 2025, University of Colorado Boulder

/**
 * FluentComment - represents YAML comments that are preserved during fluent type generation.
 * This class allows comments to be included as runtime objects in the fluent system.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import chipper from './chipper.js';

export type FluentCommentData = {
  // The comment text (without the leading # character)
  comment: string;

  // Line number where the comment appears in the YAML file
  lineNumber: number;

  // Optional: the key that this comment is associated with (if it precedes a key-value pair)
  associatedKey?: string;
};

export default class FluentComment {

  public readonly comment: string;
  public readonly lineNumber: number;
  public readonly associatedKey?: string;

  public constructor( data: FluentCommentData ) {
    this.comment = data.comment;
    this.lineNumber = data.lineNumber;
    this.associatedKey = data.associatedKey;
  }

  /**
   * Returns the comment text for display purposes.
   */
  public toString(): string {
    return this.comment;
  }
}

chipper.register( 'FluentComment', FluentComment );