import { Injectable, Logger } from "@nestjs/common";
import { Subject, Observable, filter, map } from "rxjs";
import { GameEvent, EventHandler, EventFilter, EventType } from "./dto";

/**
 * Abstract event publisher interface for future extensibility (Kafka, Pulsar, etc.)
 */
export interface EventPublisher {
  publish(event: GameEvent): Promise<void>;
}

/**
 * Abstract event subscriber interface for future extensibility
 */
export interface EventSubscriber {
  subscribe<T extends GameEvent>(
    eventType: EventType,
    handler: EventHandler<T>,
    filter?: EventFilter,
  ): void;
  unsubscribe(eventType: EventType, handler: EventHandler): void;
}

/**
 * In-memory event bus implementation using RxJS
 * Can be easily replaced with message queue implementations later
 */
@Injectable()
export class EventBusService implements EventPublisher, EventSubscriber {
  private readonly logger = new Logger(EventBusService.name);
  private readonly eventSubject = new Subject<GameEvent>();
  private readonly handlers = new Map<EventType, Set<EventHandler>>();

  /**
   * Publish an event to all subscribers
   */
  async publish(event: GameEvent): Promise<void> {
    try {
      // Set timestamp if not provided
      if (!event.timestamp) {
        event.timestamp = new Date();
      }

      this.logger.debug(`Publishing event: ${event.type}`, {
        eventId: event.id,
        actorId: event.actorId,
        targetId: event.targetId,
        sessionId: event.sessionId,
      });

      // Emit to RxJS subject for reactive subscribers
      this.eventSubject.next(event);

      // Call registered handlers synchronously
      const eventHandlers = this.handlers.get(event.type);
      if (eventHandlers) {
        const promises = Array.from(eventHandlers).map((handler) =>
          this.safeExecuteHandler(handler, event),
        );
        await Promise.all(promises);
      }
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.type}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T extends GameEvent>(
    eventType: EventType,
    handler: EventHandler<T>,
    eventFilter?: EventFilter,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    // Create a filtered handler if filter is provided
    const filteredHandler: EventHandler = eventFilter
      ? (event: GameEvent) => {
          if (this.matchesFilter(event, eventFilter)) {
            return handler(event as T);
          }
        }
      : (handler as EventHandler);

    this.handlers.get(eventType)!.add(filteredHandler);

    this.logger.debug(`Subscribed to event type: ${eventType}`);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: EventType, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(eventType);
      }
      this.logger.debug(`Unsubscribed from event type: ${eventType}`);
    }
  }

  /**
   * Get an observable for reactive event consumption
   */
  getEventObservable<T extends GameEvent>(
    eventType?: EventType,
    eventFilter?: EventFilter,
  ): Observable<T> {
    let observable = this.eventSubject.asObservable();

    if (eventType) {
      observable = observable.pipe(filter((event) => event.type === eventType));
    }

    if (eventFilter) {
      observable = observable.pipe(
        filter((event) => this.matchesFilter(event, eventFilter)),
      );
    }

    return observable as Observable<T>;
  }

  /**
   * Check if an event matches the given filter
   */
  private matchesFilter(event: GameEvent, filter: EventFilter): boolean {
    if (filter.type && event.type !== filter.type) {
      return false;
    }
    if (filter.actorId && event.actorId !== filter.actorId) {
      return false;
    }
    if (filter.targetId && event.targetId !== filter.targetId) {
      return false;
    }
    if (filter.sessionId && event.sessionId !== filter.sessionId) {
      return false;
    }
    if (filter.campaignId && event.campaignId !== filter.campaignId) {
      return false;
    }
    if (filter.global !== undefined && event.global !== filter.global) {
      return false;
    }
    return true;
  }

  /**
   * Safely execute an event handler with error handling
   */
  private async safeExecuteHandler(
    handler: EventHandler,
    event: GameEvent,
  ): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      this.logger.error(`Event handler failed for event: ${event.type}`, error);
      // Don't rethrow - we don't want one failing handler to break others
    }
  }

  /**
   * Get handler count for a specific event type (for monitoring)
   */
  getHandlerCount(eventType: EventType): number {
    return this.handlers.get(eventType)?.size || 0;
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): EventType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearHandlers(): void {
    this.handlers.clear();
    this.logger.debug("Cleared all event handlers");
  }
}
