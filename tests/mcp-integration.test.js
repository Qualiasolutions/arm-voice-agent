// MCP Integration Tests for Armenius Store Voice Assistant
import { describe, test, expect, beforeAll } from 'vitest';
import { testMcpConnection, validateMcpTool, generateMcpToolConfig } from '../config/mcp-config.js';
import assistantConfig from '../config/vapi-assistant.js';

describe('MCP Integration Tests', () => {
  
  describe('MCP Configuration Validation', () => {
    test('should validate MCP tool configuration correctly', () => {
      const validConfig = {
        type: "mcp",
        name: "mcpTools",
        server: {
          url: "https://mcp.zapier.com/api/mcp/s/test/mcp"
        }
      };

      const result = validateMcpTool(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid MCP tool configuration', () => {
      const invalidConfig = {
        type: "invalid",
        name: "mcpTools"
        // missing server
      };

      const result = validateMcpTool(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid URL format', () => {
      const invalidUrlConfig = {
        type: "mcp",
        name: "mcpTools",
        server: {
          url: "not-a-valid-url"
        }
      };

      const result = validateMcpTool(invalidUrlConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Server URL is not a valid URL');
    });
  });

  describe('Assistant Configuration Integration', () => {
    test('should include MCP tool in assistant functions', () => {
      const mcpTool = assistantConfig.model.functions.find(
        func => func.type === 'mcp' && func.name === 'mcpTools'
      );
      
      expect(mcpTool).toBeDefined();
      expect(mcpTool.server).toBeDefined();
      expect(mcpTool.server.url).toBeDefined();
    });

    test('should have proper MCP tool configuration', () => {
      const mcpTool = assistantConfig.model.functions.find(
        func => func.type === 'mcp'
      );
      
      if (mcpTool) {
        const validation = validateMcpTool(mcpTool);
        expect(validation.valid).toBe(true);
      }
    });
  });

  describe('MCP Tool Generation', () => {
    test('should generate valid MCP tool configuration', () => {
      const serverUrl = "https://mcp.zapier.com/api/mcp/s/test/mcp";
      const config = generateMcpToolConfig(serverUrl);
      
      const validation = validateMcpTool(config);
      expect(validation.valid).toBe(true);
    });

    test('should include custom options in generated config', () => {
      const serverUrl = "https://mcp.zapier.com/api/mcp/s/test/mcp";
      const options = {
        name: "customMcp",
        description: "Custom MCP tool",
        protocol: "sse"
      };
      
      const config = generateMcpToolConfig(serverUrl, options);
      
      expect(config.name).toBe(options.name);
      expect(config.description).toBe(options.description);
      expect(config.metadata.protocol).toBe(options.protocol);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing environment variables gracefully', () => {
      // Test with no MCP_SERVER_URL environment variable
      const mcpTool = assistantConfig.model.functions.find(
        func => func.type === 'mcp'
      );
      
      // Should fall back to default placeholder URL
      expect(mcpTool?.server?.url).toBeDefined();
      expect(typeof mcpTool?.server?.url).toBe('string');
    });
  });
});

describe('MCP Functionality Tests', () => {
  // These tests would require actual MCP server access
  // For now, they serve as integration test templates
  
  describe('Connection Tests', () => {
    test.skip('should connect to MCP server successfully', async () => {
      const serverUrl = process.env.MCP_SERVER_URL;
      
      if (!serverUrl || serverUrl.includes('YOUR_ZAPIER_MCP_TOKEN')) {
        console.log('Skipping MCP connection test - no valid server URL configured');
        return;
      }
      
      const result = await testMcpConnection(serverUrl);
      expect(result.success).toBe(true);
      expect(result.tools).toBeDefined();
    });

    test.skip('should handle connection failures gracefully', async () => {
      const invalidUrl = "https://invalid-mcp-server.com/mcp";
      
      const result = await testMcpConnection(invalidUrl);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Tool Discovery', () => {
    test.skip('should discover available MCP tools', async () => {
      const serverUrl = process.env.MCP_SERVER_URL;
      
      if (!serverUrl || serverUrl.includes('YOUR_ZAPIER_MCP_TOKEN')) {
        console.log('Skipping tool discovery test - no valid server URL configured');
        return;
      }
      
      const result = await testMcpConnection(serverUrl);
      
      if (result.success) {
        expect(result.tools).toBeInstanceOf(Array);
        expect(result.tools.length).toBeGreaterThan(0);
        
        // Check for expected business-relevant tools
        const toolNames = result.tools.map(tool => tool.name);
        console.log('Available MCP tools:', toolNames);
      }
    });
  });
});

// Mock webhook payload for MCP testing
export const mockMcpWebhookPayload = {
  type: "function-call",
  call: {
    id: "test-call-123",
    customer: {
      number: "+35799123456"
    }
  },
  functionCall: {
    name: "mcpTools",
    parameters: {
      tool: "send_email",
      recipient: "customer@example.com",
      subject: "Appointment Confirmation - Armenius Store",
      body: "Your appointment has been confirmed for tomorrow at 2 PM."
    }
  }
};

// Integration test helper
export function createMcpTestScenario(toolName, parameters) {
  return {
    type: "function-call",
    call: {
      id: `test-call-${Date.now()}`,
      customer: { number: "+35799123456" }
    },
    functionCall: {
      name: "mcpTools",
      parameters: {
        tool: toolName,
        ...parameters
      }
    }
  };
}