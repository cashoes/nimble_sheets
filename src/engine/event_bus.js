/**
 * @fileoverview EVENT BUS MODULE
 * Simple publish-subscribe system for decoupling components.
 */

/**
 * EventBus class for loose coupling between modules.
 */
class EventBus {
    constructor() {
        /** @private @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event.
     * @param {string} event - Event name.
     * @param {Function} callback - Function to call when event is published.
     * @returns {Function} Unsubscribe function.
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.unsubscribe(event, callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - Event name.
     * @param {Function} callback - Function to remove.
     */
    unsubscribe(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
            // Clean up empty sets
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Publish an event.
     * @param {string} event - Event name.
     * @param {*} data - Data to pass to subscribers.
     */
    publish(event, data) {
        if (this.listeners.has(event)) {
            // Clone the set to avoid issues if subscribers modify the set during iteration
            const callbacks = new Set(this.listeners.get(event));
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`Error in event handler for '${event}':`, err);
                }
            }
        }
    }

    /**
     * Check if there are any subscribers for an event.
     * @param {string} event - Event name.
     * @returns {boolean} True if there are subscribers.
     */
    hasListeners(event) {
        return this.listeners.has(event) && this.listeners.get(event).size > 0;
    }

    /**
     * Get number of subscribers for an event.
     * @param {string} event - Event name.
     * @returns {number} Number of subscribers.
     */
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).size : 0;
    }
}

// Create a singleton instance for global use
const eventBus = new EventBus();

// Export for use in other modules
window.EventBus = EventBus;
window.eventBus = eventBus;