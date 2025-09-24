import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const TableView = ({ data }) => {
    // Parsear la tabla desde el texto markdown
    const parseMarkdownTable = (text) => {
        try {
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            if (lines.length < 2) return null;
            const headerLine = lines[0];
            const separatorLine = lines[1];
            if (!/^\s*\|?\s*[-: ]+\|[-| :]*$/.test(separatorLine)) return null;
            const headers = headerLine
                .split('|')
                .map(cell => cell.trim())
                .filter(cell => cell.length > 0);
            const rows = lines.slice(2)
                .filter(line => line.includes('|'))
                .map(line =>
                    line
                        .split('|')
                        .map(cell => cell.trim())
                        .filter(cell => cell.length > 0)
                );
            return {
                headers,
                rows
            };
        } catch (error) {
            console.error('Error parsing markdown table:', error);
            return null;
        }
    };

    const renderTable = (text) => {
        const tableData = parseMarkdownTable(text);
        if (!tableData) return null;

        return (
            <ScrollView horizontal className="mt-2">
                <View>
                    {/* Headers */}
                    <View className="flex-row border-b border-gray-200">
                        {tableData.headers.map((header, index) => (
                            <View 
                                key={index} 
                                className="px-4 py-2 min-w-[120px] bg-gray-50"
                                style={index === 0 ? { minWidth: 80 } : {}}
                            >
                                <Text className="font-medium text-sm text-gray-700">
                                    {header}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Rows */}
                    {tableData.rows.map((row, rowIndex) => (
                        <View key={rowIndex} className="flex-row border-b border-gray-100">
                            {row.map((cell, cellIndex) => (
                                <View 
                                    key={cellIndex} 
                                    className="px-4 py-2 min-w-[120px]"
                                    style={cellIndex === 0 ? { minWidth: 80, backgroundColor: '#fafafa' } : {}}
                                >
                                    <Text className="text-sm text-gray-800">
                                        {cell}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    // Buscar tablas en el texto y renderizarlas
    const hasMarkdownTable = (text) => {
        const lines = text.split('\n');
        for (let i = 0; i < lines.length - 2; i++) {
            if (
                lines[i].includes('|') &&
                /^\s*\|?\s*[-: ]+\|[-| :]*$/.test(lines[i + 1]) &&
                lines[i + 2].includes('|')
            ) {
                return true;
            }
        }
        return false;
    };

    if (!hasMarkdownTable(data)) {
        return null;
    }

    return renderTable(data);
};

export default TableView;