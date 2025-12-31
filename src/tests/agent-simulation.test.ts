import { describe, it, expect } from 'vitest';
import {
    createInitialState,
    mergeVariables,
    validateName,
    validateEmail,
    validateTime,
    AgentVariables,
} from '@/lib/ai/agent-state';

describe('Agent Simulation Tests', () => {

    describe('validateName()', () => {
        it('should validate correct names', () => {
            const validNames = ['John', 'Maria', 'Peter', 'Carlos', 'Ana', 'Lucas'];
            validNames.forEach(name => {
                expect(validateName(name).valid, `"${name}" should be a valid name`).toBe(true);
            });
        });

        it('should invalidate days of the week', () => {
            const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            daysOfWeek.forEach(day => {
                expect(validateName(day).valid, `"${day}" should be an invalid name`).toBe(false);
            });
        });

        it('should invalidate time formats', () => {
            const timeFormats = ['at 16', '10h', '14:30', 'at 10'];
            timeFormats.forEach(time => {
                expect(validateName(time).valid, `"${time}" should be an invalid name`).toBe(false);
            });
        });

        it('should invalidate confirmations', () => {
            const confirmations = ['yes', 'no', 'ok', 'right', 'cool'];
            confirmations.forEach(conf => {
                expect(validateName(conf).valid, `"${conf}" should be an invalid name`).toBe(false);
            });
        });
    });

    describe('validateTime()', () => {
        it('should validate and normalize correct time formats', () => {
            const validTimes = [
                { input: 'at 16', expected: '16:00' },
                { input: 'at 10', expected: '10:00' },
                { input: '14h', expected: '14:00' },
                { input: '10:30', expected: '10:30' },
                { input: '16h30', expected: '16:30' },
            ];
            validTimes.forEach(({ input, expected }) => {
                const result = validateTime(input);
                expect(result.valid).toBe(true);
                expect(result.normalized).toBe(expected);
            });
        });

        it('should invalidate times outside business hours', () => {
            const invalidTimes = ['3h', 'at 5', '23:00', 'at 2'];
            invalidTimes.forEach(time => {
                expect(validateTime(time).valid).toBe(false);
            });
        });
    });

    describe('validateEmail()', () => {
        it('should validate correct email formats', () => {
            const validEmails = ['test@example.com', 'user.name@domain.org', 'john@gmail.com'];
            validEmails.forEach(email => {
                expect(validateEmail(email).valid).toBe(true);
            });
        });

        it('should invalidate incorrect email formats', () => {
            const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];
            invalidEmails.forEach(email => {
                expect(validateEmail(email).valid).toBe(false);
            });
        });
    });

    describe('mergeVariables()', () => {
        const baseVars: AgentVariables = { name: null, email: null, phone: null, area: null, challenge: null, meeting_date: null, meeting_time: null };

        it('should perform a simple merge correctly', () => {
            const result = mergeVariables({ ...baseVars }, { name: 'John', email: 'john@gmail.com' });
            expect(result.name).toBe('John');
            expect(result.email).toBe('john@gmail.com');
        });

        it('should protect existing values from being overwritten', () => {
            const result = mergeVariables({ ...baseVars, name: 'John' }, { name: 'monday' }, { protectExisting: true });
            expect(result.name).toBe('John');
        });

        it('should reject invalid values before merging', () => {
            const result = mergeVariables({ ...baseVars }, { name: 'monday' }, { validateBeforeMerge: true });
            expect(result.name).toBeNull();
        });
    });

    describe('Full Conversation Simulation', () => {
        it('should extract and protect variables throughout a conversation', () => {
            const state = createInitialState('thread_123', 'agent_456', 'user_789');
            let currentVars: AgentVariables = state.variables;

            const messages = [
                'Hello, my name is John',
                'I have a shoe store',
                'My challenge is customer service time',
                'monday',
                'at 16',
                'john@gmail.com',
            ];

            for (const user of messages) {
                const extracted: Partial<AgentVariables> = {};
                const nameMatch = user.match(/(?:my name is|I'm|I am)\s*([A-ZÀ-Úa-zà-ú]+)/i);
                if (nameMatch && nameMatch[1] && validateName(nameMatch[1].trim()).valid) {
                    extracted.name = nameMatch[1].trim();
                } else if (/^[a-zA-ZÀ-ú]+$/.test(user) && user.length < 20 && validateName(user).valid) {
                    extracted.name = user;
                }

                if (user.includes('@')) extracted.email = user.toLowerCase();

                if (/^at\s*\d/i.test(user) || /^\d{1,2}[h:]/i.test(user)) {
                    const timeResult = validateTime(user);
                    if (timeResult.valid) extracted.meeting_time = timeResult.normalized;
                }

                if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(user.toLowerCase())) {
                    extracted.meeting_date = '29/12';
                }

                currentVars = mergeVariables(currentVars, extracted, { protectExisting: true, validateBeforeMerge: true });
            }

            expect(currentVars.name).toBe('John');
            expect(currentVars.meeting_date).toBe('29/12');
            expect(currentVars.meeting_time).toBe('16:00');
            expect(currentVars.email).toBe('john@gmail.com');
        });
    });
});
