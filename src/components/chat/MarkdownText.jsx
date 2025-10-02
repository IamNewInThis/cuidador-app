import React from 'react';
import { View, Text } from 'react-native';

const parseMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('### ')) {
            elements.push({ type: 'h3', content: line.replace('### ', ''), key: i });
        } else if (line.startsWith('## ')) {
            elements.push({ type: 'h2', content: line.replace('## ', ''), key: i });
        } else if (line.startsWith('# ')) {
            elements.push({ type: 'h1', content: line.replace('# ', ''), key: i });
        } else if (line.trim() === '') {
            elements.push({ type: 'space', key: i });
        } else {
            elements.push({ type: 'text', content: line, key: i });
        }
    }

    return elements;
};

const renderInlineText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <Text key={index} style={{ fontWeight: 'bold', color: '#111827' }}>
                    {part.slice(2, -2)}
                </Text>
            );
        }

        return (
            <Text key={index}>
                {part}
            </Text>
        );
    });
};

const MarkdownText = ({ text }) => {
    if (!text) return null;

    const elements = parseMarkdown(text);

    return (
        <View>
            {elements.map((element) => {
                switch (element.type) {
                    case 'h1':
                        return (
                            <Text
                                key={element.key}
                                style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: 8,
                                    marginTop: 12,
                                }}
                                selectable
                            >
                                {renderInlineText(element.content)}
                            </Text>
                        );
                    case 'h2':
                        return (
                            <Text
                                key={element.key}
                                style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: 6,
                                    marginTop: 10,
                                }}
                                selectable
                            >
                                {renderInlineText(element.content)}
                            </Text>
                        );
                    case 'h3':
                        return (
                            <Text
                                key={element.key}
                                style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: 4,
                                    marginTop: 8,
                                }}
                                selectable
                            >
                                {renderInlineText(element.content)}
                            </Text>
                        );
                    case 'text':
                        return (
                            <Text
                                key={element.key}
                                style={{
                                    fontSize: 14,
                                    color: '#1F2937',
                                    lineHeight: 20,
                                    marginBottom: 4,
                                }}
                                selectable
                            >
                                {renderInlineText(element.content)}
                            </Text>
                        );
                    case 'space':
                        return (
                            <View key={element.key} style={{ height: 8 }} />
                        );
                    default:
                        return null;
                }
            })}
        </View>
    );
};

export const splitTextAndTable = (text) => {
    if (!text) {
        return { before: '', table: null, after: null };
    }

    const lines = text.split('\n');
    let start = -1;
    let end = -1;

    for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].includes('|') && /^\s*\|?\s*[-: ]+\|[-| :]*$/.test(lines[i + 1])) {
            start = i;
            end = i + 2;
            while (end < lines.length && lines[end].includes('|')) {
                end++;
            }
            break;
        }
    }

    if (start === -1 || end === -1) {
        return { before: text, table: null, after: null };
    }

    const before = lines.slice(0, start).join('\n').trim();
    const table = lines.slice(start, end).join('\n');
    const after = lines.slice(end).join('\n').trim();

    return { before, table, after };
};

export default MarkdownText;
